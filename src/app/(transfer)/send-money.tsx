import { useCallback, useEffect, useRef, useState } from 'react';
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

import { ACCOUNT_NUMBER_LENGTH, MAX_TRANSFER_AMOUNT } from '@/constants';
import { walletService } from '@/services/wallet.service';
import { useAuthStore } from '@/stores/auth.store';
import { useTransferStore } from '@/stores/transfer.store';
import type { Bank, Beneficiary, TransferType } from '@/types/transfer.types';

const TABS: { key: TransferType; label: string }[] = [
  { key: 'neatpay', label: 'NEAT Microcredit' },
  { key: 'other_bank', label: 'Other Banks Transfers' },
];

export default function SendMoneyScreen() {
  const store = useTransferStore();
  const user = useAuthStore((s) => s.user);

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

  // Beneficiary selection
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(false);
  const [beneficiaryModalVisible, setBeneficiaryModalVisible] = useState(false);
  const [beneficiarySearch, setBeneficiarySearch] = useState('');
  const prefilled = useRef(false);

  // Amount & narration
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch banks on first switch to Other Banks tab
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

  // Fetch beneficiaries
  const fetchBeneficiaries = useCallback(async () => {
    if (beneficiaries.length > 0) return;
    setBeneficiariesLoading(true);
    try {
      const result = await walletService.getBeneficiaries();
      setBeneficiaries(result);
    } catch {
      // silent — user can retry by reopening modal
    } finally {
      setBeneficiariesLoading(false);
    }
  }, [beneficiaries.length]);

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
    if (activeTab !== 'other_bank') return;

    // Skip validation if prefilled from beneficiary
    if (prefilled.current) {
      prefilled.current = false;
      return;
    }

    if (accountNumber.length !== ACCOUNT_NUMBER_LENGTH || !selectedBank) {
      setAccountName('');
      setValidationError('');
      return;
    }

    if (validationTimer.current) clearTimeout(validationTimer.current);

    validationTimer.current = setTimeout(async () => {
      setValidating(true);
      setAccountName('');
      setValidationError('');
      try {
        const result = await walletService.validateAccount(
          accountNumber,
          selectedBank.code,
        );
        setAccountName(result.accountName);
      } catch (err: any) {
        setValidationError(
          err?.response?.data?.error || 'Could not validate account',
        );
      } finally {
        setValidating(false);
      }
    }, 300);

    return () => {
      if (validationTimer.current) clearTimeout(validationTimer.current);
    };
  }, [accountNumber, selectedBank, activeTab]);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()),
  );

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const search = beneficiarySearch.toLowerCase();
    return (
      b.account_name.toLowerCase().includes(search) ||
      b.account_number.includes(search)
    );
  });

  const getBankName = (bankCode: string) =>
    banks.find((b) => b.code === bankCode)?.name ?? bankCode;

  const parsedAmount = parseInt(amount, 10) || 0;
  const amountExceedsMax = parsedAmount > MAX_TRANSFER_AMOUNT;

  const canProceed =
    !amountExceedsMax &&
    (activeTab === 'neatpay'
      ? accountNumber.length === ACCOUNT_NUMBER_LENGTH && parsedAmount > 0
      : accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
        accountName !== '' &&
        selectedBank !== null &&
        parsedAmount > 0);

  const handleProceed = () => {
    if (!canProceed) return;
    store.setTransferType(activeTab);
    if (activeTab === 'other_bank' && selectedBank) {
      store.setBank(selectedBank.code, selectedBank.name);
    } else {
      store.setBank('', 'Neatpay');
    }
    store.setAccountDetails(accountNumber, accountName);
    store.setAmount(amount);
    store.setNarration(narration);
    store.setSenderPhone(user?.phone ?? '');
    router.push('/(transfer)/transfer-review');
  };

  const handleSelectBeneficiary = async (beneficiary: Beneficiary) => {
    prefilled.current = true;
    setAccountNumber(beneficiary.account_number);
    setAccountName(beneficiary.account_name);
    setBeneficiaryModalVisible(false);
    setBeneficiarySearch('');

    if (activeTab === 'other_bank') {
      // Ensure banks are loaded so we can find the matching bank
      let bankList = banks;
      if (bankList.length === 0) {
        try {
          const result = await walletService.getBanks();
          setBanks(result);
          bankList = result;
        } catch {
          // fallback — set bank code directly
        }
      }
      const matchedBank = bankList.find(
        (b) => b.code === beneficiary.bank_code,
      );
      setSelectedBank(
        matchedBank ?? { code: beneficiary.bank_code, name: beneficiary.bank_code },
      );
    }
  };

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setBankModalVisible(false);
    setBankSearch('');
    // Reset account validation when bank changes
    setAccountName('');
    setValidationError('');
  };

  const formatAmount = (text: string) => {
    setAmount(text.replace(/\D/g, ''));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Back button */}
        <TouchableOpacity
          className="self-start border border-[#E5E7EB] rounded-[20px] px-6 py-1.5 mt-2 mb-12"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>

        <Text className="text-[20px] font-medium text-[#1A1A1A] mb-8">
          Send Money
        </Text>

        {/* Transfer Type label */}
        <Text className="text-sm font-semibold text-[#1A1A1A] mb-6">
          Transfer to:
        </Text>

        {/* Tab pills */}
        <View className="flex-row bg-[#F3F3F4] rounded-full py-3 px-3 mb-6">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 rounded-full items-center ${
                activeTab === tab.key ? 'bg-[#472FF8]' : ''
              }`}
              onPress={() => {
                setActiveTab(tab.key);
                if (tab.key === 'other_bank') fetchBanks();
              }}
              activeOpacity={0.85}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  activeTab === tab.key ? 'text-white' : 'text-[#6B7280]'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <KeyboardAwareScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'other_bank' && (
            <View className="mb-5">
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
          <View className="mb-5">
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
                  setAccountNumber(t.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH))
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
            {accountNumber === '' && (
              <TouchableOpacity
                className="flex-row items-center mt-3"
                onPress={() => {
                  fetchBanks();
                  fetchBeneficiaries();
                  setBeneficiaryModalVisible(true);
                }}
              >
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={20}
                  color="#472FF8"
                />
                <Text className="text-[13px] font-medium text-[#472FF8] ml-1.5">
                  Select from Beneficiary
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Amount */}
          <View className="mb-5">
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
            {amountExceedsMax && (
              <Text className="text-xs text-red-500 mt-1.5">
                Amount exceeds maximum of ₦{MAX_TRANSFER_AMOUNT.toLocaleString('en-NG')}
              </Text>
            )}
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
        </KeyboardAwareScrollView>

        {/* Proceed button */}
        <View className="pb-4">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${
              canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'
            }`}
            onPress={handleProceed}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text
              className={`text-base font-semibold ${
                canProceed ? 'text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Proceed
            </Text>
          </TouchableOpacity>
        </View>
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

            {/* Search */}
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

      {/* Beneficiary selection modal */}
      <Modal visible={beneficiaryModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl flex-1 mt-[30%] pt-4 pb-8">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-bold text-[#1A1A1A]">
                Select Beneficiary
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setBeneficiaryModalVisible(false);
                  setBeneficiarySearch('');
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-6 mb-3">
              <View className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex-row items-center">
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  className="flex-1 text-[15px] text-[#1A1A1A] ml-2 p-0"
                  value={beneficiarySearch}
                  onChangeText={setBeneficiarySearch}
                  placeholder="Search beneficiary"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>
            </View>

            {beneficiariesLoading ? (
              <ActivityIndicator
                size="large"
                color="#472FF8"
                className="mt-8"
              />
            ) : (
              <FlatList
                data={filteredBeneficiaries}
                keyExtractor={(item) =>
                  `${item.bank_code}-${item.account_number}`
                }
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="px-6 py-4 bg-gray-100 border-b border-[#F3F4F6]"
                    onPress={() => handleSelectBeneficiary(item)}
                  >
                    <Text className="text-[20px] font-bold text-[#1A1A1A]">
                      {item.account_name}
                    </Text>
                    <Text className="text-[13px] text-[#6B7280] mt-0.5">
                      {getBankName(item.bank_code)}  •  {item.account_number}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="text-center text-[#9CA3AF] mt-8">
                    No beneficiaries found
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
