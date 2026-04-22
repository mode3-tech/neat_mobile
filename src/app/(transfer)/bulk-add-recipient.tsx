import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ACCOUNT_NUMBER_LENGTH, NEAT_BANK_CODE } from '@/constants';
import { accountService } from '@/services/account.service';
import { walletService } from '@/services/wallet.service';
import { useBulkTransferStore } from '@/stores/bulk-transfer.store';
import type { Bank, BulkRecipient, TransferType } from '@/types/transfer.types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const TABS: { key: TransferType; label: string }[] = [
  { key: 'neatpay', label: 'NEAT Microcredit' },
  { key: 'other_bank', label: 'Other Banks Transfers' },
];

function formatNaira(amount: number): string {
  return (
    '₦' +
    new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  );
}

export default function BulkAddRecipientScreen() {
  const { recipients, addRecipient, removeRecipient } = useBulkTransferStore();

  const { data: accountSummary } = useQuery({
    queryKey: ['account-summary'],
    queryFn: accountService.getSummary,
  });

  const [activeTab, setActiveTab] = useState<TransferType>('neatpay');

  // Bank selection
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  // Account
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Amount & narration
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  // Pending recipient removal (drives the confirm modal)
  const [pendingRemoval, setPendingRemoval] = useState<BulkRecipient | null>(
    null,
  );
  // Drives the "already added" info modal
  const [duplicateAlertVisible, setDuplicateAlertVisible] = useState(false);

  const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic id incremented on every validation attempt. Stale responses that
  // don't match the latest id are discarded so an out-of-order resolve can't
  // pin the wrong account name to the current input.
  const validationRequestId = useRef(0);

  const fetchBanks = useCallback(async () => {
    if (banks.length > 0) return;
    setBanksLoading(true);
    try {
      const result = await walletService.getBanks();
      setBanks(result);
    } catch {
      // silent — user can retry by reopening modal
    } finally {
      setBanksLoading(false);
    }
  }, [banks.length]);

  // Reset account fields when tab changes
  useEffect(() => {
    setAccountNumber('');
    setAccountName('');
    setValidationError('');
    setSelectedBank(null);
    setAmount('');
    setNarration('');
  }, [activeTab]);

  // Validate account number for Other Banks
  useEffect(() => {
    // Bump the id at the top of every run — even when we early-return — so any
    // in-flight request from a previous run (different tab, fewer digits, prior
    // bank) is invalidated and can't write its result back into state.
    const myRequestId = ++validationRequestId.current;

    const bankCode =
      activeTab === 'neatpay' ? NEAT_BANK_CODE : selectedBank?.code;

    // Clear stale results synchronously on every keystroke so the previous
    // validation's name can't sit alongside a newly-edited account number,
    // even briefly, while the next debounce/request is in flight.
    setAccountName('');
    setValidationError('');

    if (accountNumber.length !== ACCOUNT_NUMBER_LENGTH || !bankCode) {
      setValidating(false);
      return;
    }

    if (validationTimer.current) clearTimeout(validationTimer.current);

    validationTimer.current = setTimeout(async () => {
      setValidating(true);
      try {
        const result = await walletService.validateAccount(
          accountNumber,
          bankCode,
        );
        if (myRequestId !== validationRequestId.current) return;
        setAccountName(result.accountName);
      } catch (err: any) {
        if (myRequestId !== validationRequestId.current) return;
        setValidationError(
          err?.response?.data?.error || 'Could not validate account',
        );
      } finally {
        if (myRequestId === validationRequestId.current) setValidating(false);
      }
    }, 300);

    return () => {
      if (validationTimer.current) clearTimeout(validationTimer.current);
    };
  }, [accountNumber, selectedBank, activeTab]);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()),
  );

  const parsedAmount = parseInt(amount, 10) || 0;

  const totalPayment = useMemo(
    () => recipients.reduce((sum, r) => sum + r.amount, 0),
    [recipients],
  );

  const availableBalance = accountSummary?.available_balance ?? 0;
  const exceedsBalance =
    availableBalance > 0 && totalPayment > availableBalance;

  const canAdd =
    parsedAmount > 0 &&
    accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
    accountName !== '' &&
    (activeTab === 'neatpay' ? true : selectedBank !== null);

  const handleAddRecipient = () => {
    if (!canAdd) return;

    const newSortCode =
      activeTab === 'other_bank'
        ? selectedBank?.code ?? ''
        : NEAT_BANK_CODE;
    const isDuplicate = recipients.some(
      (r) =>
        r.account_number === accountNumber && r.sort_code === newSortCode,
    );
    if (isDuplicate) {
      setDuplicateAlertVisible(true);
      return;
    }

    const recipient: BulkRecipient = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      transferType: activeTab,
      amount: parsedAmount,
      sort_code: newSortCode,
      account_number: accountNumber,
      account_name: accountName,
      bank_name:
        activeTab === 'other_bank' ? selectedBank?.name ?? '' : 'Neatpay',
      narration,
    };
    addRecipient(recipient);
    setAccountNumber('');
    setAccountName('');
    setValidationError('');
    setAmount('');
    setNarration('');
  };

  const handleProceed = () => {
    if (recipients.length === 0 || exceedsBalance) return;
    router.push('/(transfer)/bulk-transfer-review');
  };

  const handleRemove = (recipient: BulkRecipient) => {
    setPendingRemoval(recipient);
  };

  const confirmRemove = () => {
    if (pendingRemoval) removeRecipient(pendingRemoval.id);
    setPendingRemoval(null);
  };

  const cancelRemove = () => setPendingRemoval(null);

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setBankModalVisible(false);
    setBankSearch('');
    setAccountName('');
    setValidationError('');
  };

  const formatAmount = (text: string) => {
    setAmount(text.replace(/\D/g, ''));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <TouchableOpacity
          className="self-start border border-[#E5E7EB] rounded-[20px] px-6 py-1.5 mt-2 mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>

        <Text className="text-[20px] font-medium text-[#1A1A1A] mb-5">
          Add recipient
        </Text>

        {/* Summary tile */}
        <View
          className={`rounded-xl p-4 border mb-2 ${
            exceedsBalance
              ? 'bg-[#FEF2F2] border-[#EF4444]/40'
              : 'bg-[#EEF0FF] border-[#472FF8]/30'
          }`}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[13px] text-[#1A1A1A]">Available Balance</Text>
            <Text className="text-[13px] font-semibold text-[#1A1A1A]">
              {formatNaira(availableBalance)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-[#1A1A1A]">
              Total Payment Amount
            </Text>
            <Text
              className={`text-[13px] font-semibold ${
                exceedsBalance ? 'text-[#EF4444]' : 'text-[#1A1A1A]'
              }`}
            >
              {formatNaira(totalPayment)}
            </Text>
          </View>
        </View>
        {exceedsBalance && (
          <Text className="text-xs text-red-500 mb-4">
            Total payment exceeds your available balance.
          </Text>
        )}
        {!exceedsBalance && <View className="mb-4" />}

        <KeyboardAwareScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-sm font-semibold text-[#1A1A1A] mb-3">
            Transfer to:
          </Text>

          {/* Tab pills */}
          <View className="flex-row bg-[#F3F3F4] rounded-full py-2 px-2 mb-5">
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                className={`flex-1 py-2.5 rounded-full items-center ${
                  activeTab === tab.key ? 'bg-[#472FF8]' : ''
                }`}
                onPress={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'other_bank') fetchBanks();
                }}
                activeOpacity={0.85}
              >
                <Text
                  className={`text-[12px] font-semibold ${
                    activeTab === tab.key ? 'text-white' : 'text-[#6B7280]'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'other_bank' && (
            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-[#374151] mb-2">
                Bank
              </Text>
              <TouchableOpacity
                className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center justify-between"
                onPress={() => {
                  fetchBanks();
                  setBankModalVisible(true);
                }}
              >
                <Text
                  className={`text-[15px] ${
                    selectedBank ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {selectedBank?.name ?? 'Select a bank'}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Account Number */}
          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-[#374151] mb-2">
              Account Number
            </Text>
            <View
              className={`bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] ${
                validationError ? 'border-[#EF4444] bg-white' : 'border-transparent'
              } flex-row items-center`}
            >
              <TextInput
                className="flex-1 text-[15px] text-[#1A1A1A] p-0"
                value={accountNumber}
                onChangeText={(t) =>
                  setAccountNumber(
                    t.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH),
                  )
                }
                placeholder="Enter account number"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={ACCOUNT_NUMBER_LENGTH}
              />
              {validating && <ActivityIndicator size="small" color="#472FF8" />}
            </View>
            {accountName !== '' && (
              <Text className="text-[13px] text-[#16A34A] mt-1.5 font-medium">
                {accountName}
              </Text>
            )}
            {validationError !== '' && (
              <Text className="text-xs text-red-500 mt-1.5">
                {validationError}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-[#374151] mb-2">
              Amount
            </Text>
            <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
              <Text className="text-[15px] text-[#9CA3AF] mr-1">₦</Text>
              <TextInput
                className="flex-1 text-[15px] text-[#1A1A1A] p-0"
                value={amount}
                onChangeText={formatAmount}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Narration */}
          <View className="mb-5">
            <Text className="text-[13px] font-semibold text-[#374151] mb-2">
              Narration
            </Text>
            <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent">
              <TextInput
                className="text-[15px] text-[#1A1A1A] p-0"
                value={narration}
                onChangeText={setNarration}
                placeholder="Enter narration"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Add recipient button */}
          <TouchableOpacity
            className={`rounded-full py-4 items-center flex-row justify-center border-[1.5px] mb-6 ${
              canAdd ? 'border-[#472FF8]' : 'border-[#E5E7EB]'
            }`}
            onPress={handleAddRecipient}
            disabled={!canAdd}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={canAdd ? '#472FF8' : '#9CA3AF'}
            />
            <Text
              className={`text-base font-semibold ml-1 ${
                canAdd ? 'text-[#472FF8]' : 'text-[#9CA3AF]'
              }`}
            >
              Add recipient
            </Text>
          </TouchableOpacity>

          {recipients.length > 0 && (
            <>
              <Text className="text-base font-semibold text-[#1A1A1A] mt-2 mb-3">
                Added Recipients ({recipients.length})
              </Text>
              <View className="mb-4">
                {recipients.map((r, i) => (
                  <View
                    key={r.id}
                    className="flex-row items-start py-4 border-b border-[#F3F4F6]"
                  >
                    <View className="w-8 h-8 rounded-full bg-[#F59E0B] items-center justify-center mr-3 mt-0.5">
                      <Text className="text-white text-[13px] font-bold">
                        {i + 1}
                      </Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text
                        className="text-[14px] font-bold text-[#1A1A1A]"
                        numberOfLines={1}
                      >
                        {r.account_name}
                      </Text>
                      <Text
                        className="text-[12px] text-[#6B7280] mt-0.5"
                        numberOfLines={1}
                      >
                        {r.account_number}
                      </Text>
                      <Text
                        className="text-[12px] text-[#472FF8] mt-0.5"
                        numberOfLines={2}
                      >
                        {r.bank_name}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[14px] font-bold text-[#16A34A]">
                        {formatNaira(r.amount)}
                      </Text>
                      <TouchableOpacity
                        className="mt-2 p-1"
                        onPress={() => handleRemove(r)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </KeyboardAwareScrollView>

        {recipients.length > 0 && (
          <View className="pb-4">
            <TouchableOpacity
              className={`rounded-full py-4 items-center ${
                exceedsBalance ? 'bg-[#E5E7EB]' : 'bg-[#472FF8]'
              }`}
              onPress={handleProceed}
              disabled={exceedsBalance}
              activeOpacity={0.85}
            >
              <Text
                className={`text-base font-semibold ${
                  exceedsBalance ? 'text-[#9CA3AF]' : 'text-white'
                }`}
              >
                Proceed
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bank selection modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl flex-1 mt-[60%] pt-4 pb-8">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-bold text-[#1A1A1A]">
                Select Bank
              </Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            <View className="px-6 mb-3">
              <View className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex-row items-center">
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  className="flex-1 text-[15px] text-[#1A1A1A] ml-2 p-0"
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  placeholder="Search bank"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>
            </View>

            {banksLoading ? (
              <ActivityIndicator
                size="large"
                color="#472FF8"
                className="mt-8"
              />
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`px-6 py-4 border-b border-[#F3F4F6] ${
                      selectedBank?.code === item.code ? 'bg-[#EEF0FF]' : ''
                    }`}
                    onPress={() => handleSelectBank(item)}
                  >
                    <Text className="text-[15px] text-[#1A1A1A]">
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="text-center text-[#9CA3AF] mt-8">
                    No banks found
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={pendingRemoval !== null}
        title={`Remove ${pendingRemoval?.account_name ?? ''} from the list?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmStyle="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />

      <ConfirmModal
        visible={duplicateAlertVisible}
        title="This account is already in the recipients list."
        confirmLabel="Got it"
        hideCancel
        onConfirm={() => setDuplicateAlertVisible(false)}
        onCancel={() => setDuplicateAlertVisible(false)}
      />
    </SafeAreaView>
  );
}
