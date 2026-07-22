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
import { router, useLocalSearchParams } from 'expo-router';

import {
  ACCOUNT_NUMBER_LENGTH,
  INSUFFICIENT_FUNDS_MESSAGE,
  NEAT_BANK_CODE,
  TRANSFER_FEE,
} from '@/constants';
import { walletService } from '@/services/wallet.service';
import { useAuthStore } from '@/stores/auth.store';
import { useTransferStore } from '@/stores/transfer.store';
import { useAccountLimits } from '@/hooks/use-account-limits';
import { useAccountSummary } from '@/hooks/use-account-summary';
import { ActivationCapBanner } from '@/components/ActivationCapBanner';
import { getErrorMessage } from '@/utils/error';
import { formatNairaShort } from '@/utils/format';
import type { Bank, Beneficiary, TransferType } from '@/types/transfer.types';

const TABS: { key: TransferType; label: string }[] = [
  { key: 'neatpay', label: 'NEAT Microcredit' },
  { key: 'other_bank', label: 'Other Banks Transfers' },
];

// Single source of truth for code -> Bank. Falls back to showing the raw code as
// the name so a failed/incomplete banks fetch degrades the *label* only — the
// code itself stays correct, which is all account validation needs.
const resolveBank = (bankCode: string, list: Bank[]): Bank =>
  list.find((b) => b.code === bankCode) ?? { code: bankCode, name: bankCode };

export default function SendMoneyScreen() {
  const store = useTransferStore();
  const user = useAuthStore((s) => s.user);
  const { data: accountSummary } = useAccountSummary();
  const { data: limits } = useAccountLimits();

  // "Transfer again" entry point. Passed as params rather than hydrated into the
  // transfer store on purpose: params die with this navigation entry, so a plain
  // push from the dashboard can never inherit a stale locked recipient.
  const {
    prefillAccountNumber = '',
    prefillBankCode = '',
    prefillAccountName = '',
    prefillAmount = '',
    prefillNarration = '',
  } = useLocalSearchParams<{
    prefillAccountNumber?: string;
    prefillBankCode?: string;
    prefillAccountName?: string;
    prefillAmount?: string;
    prefillNarration?: string;
  }>();

  const isPrefill = prefillAccountNumber !== '' && prefillBankCode !== '';

  const [lockedRecipient, setLockedRecipient] = useState(isPrefill);
  const [activeTab, setActiveTab] = useState<TransferType>(
    isPrefill && prefillBankCode !== NEAT_BANK_CODE ? 'other_bank' : 'neatpay',
  );

  // Bank selection
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  // Account
  const [accountNumber, setAccountNumber] = useState(prefillAccountNumber);
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
  // Whitelist digits rather than stripping them — stripping would turn a stray
  // "5000.50" into "500050" and silently inflate the amount 100x. Anything that
  // isn't already whole-naira digits falls back to blank.
  const [amount, setAmount] = useState(
    /^\d+$/.test(prefillAmount) ? prefillAmount : '',
  );
  const [narration, setNarration] = useState(prefillNarration);

  const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic id incremented on every validation attempt. Stale responses that
  // don't match the latest id are discarded so an out-of-order resolve can't
  // pin the wrong account name to the current input.
  const validationRequestId = useRef(0);

  // Fetch banks on first switch to Other Banks tab.
  // Returns the list so callers that need to resolve a code immediately don't
  // have to wait for the `banks` state to land in a later render.
  const fetchBanks = useCallback(async (): Promise<Bank[]> => {
    if (banks.length > 0) return banks;
    setBanksLoading(true);
    try {
      const result = await walletService.getBanks();
      setBanks(result);
      return result;
    } catch {
      // silent — user can retry by reopening modal
      return [];
    } finally {
      setBanksLoading(false);
    }
  }, [banks]);

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

  // Reset account fields when tab changes.
  // Skips its own mount run so prefilled state survives. Safe for every other
  // entry path: on mount this only ever assigned the values the fields already
  // hold, so not running it is a no-op rather than a behaviour change.
  const skipTabReset = useRef(true);

  useEffect(() => {
    if (skipTabReset.current) {
      skipTabReset.current = false;
      return;
    }
    setAccountNumber('');
    setAccountName('');
    setValidationError('');
    setSelectedBank(null);
    setAmount('');
    setNarration('');
  }, [activeTab]);

  // Resolve the prefilled bank code to a Bank, once, on mount.
  // `selectedBank` is deliberately left null until this lands rather than being
  // seeded with a {code, name: code} placeholder: the validation effect below
  // keys on selectedBank by *identity*, so swapping a placeholder for the real
  // Bank would fire it a second time and wipe the confirmed account name.
  useEffect(() => {
    if (!isPrefill || prefillBankCode === NEAT_BANK_CODE) return;
    let cancelled = false;
    fetchBanks().then((list) => {
      if (!cancelled) setSelectedBank(resolveBank(prefillBankCode, list));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate account number for Other Banks.
  // NOTE: `selectedBank` (the object) is the dep, not `selectedBank?.code`.
  // Narrowing it to the code looks like a cleanup but breaks re-selecting the
  // same bank: handleSelectBank clears accountName itself, and with a .code dep
  // no effect run would follow to refill it, leaving Proceed dead.
  useEffect(() => {
    // Bump the id at the top of every run — even when we early-return — so any
    // in-flight request from a previous run (different tab, fewer digits, prior
    // bank) is invalidated and can't write its result back into state.
    const myRequestId = ++validationRequestId.current;

    const bankCode =
      activeTab === 'neatpay' ? NEAT_BANK_CODE : selectedBank?.code;

    // Skip validation if prefilled from beneficiary — the beneficiary already
    // has a verified account name we want to keep displayed.
    if (prefilled.current) {
      prefilled.current = false;
      setValidating(false);
      return;
    }

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
      } catch (err: unknown) {
        if (myRequestId !== validationRequestId.current) return;
        setValidationError(getErrorMessage(err, 'Could not validate account'));
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

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const isNeat = b.bank_code === NEAT_BANK_CODE || b.bank_code === '';
    if (activeTab === 'neatpay' ? !isNeat : isNeat) return false;
    const search = beneficiarySearch.toLowerCase();
    return (
      b.account_name.toLowerCase().includes(search) ||
      b.account_number.includes(search)
    );
  });

  const getBankName = (bankCode: string) => resolveBank(bankCode, banks).name;

  const parsedAmount = parseInt(amount, 10) || 0;

  // The validation effect clears `accountName` on its first run, so the name
  // carried over from the transaction can't live in that state. Derive it for
  // display instead: grey = last known, unconfirmed; green = confirmed just now.
  // `canProceed` still keys off `accountName` alone, so a grey name can't be
  // transferred to.
  const displayName = accountName || (lockedRecipient ? prefillAccountName : '');

  // CBN 24h activation cap: block outflow above what's left in the window.
  // Amount input is whole naira; the limit is kobo, so compare in kobo.
  // Fail-open — if the cap isn't active or limits didn't load, never block.
  const outflowRemaining = limits?.out_flow?.remaining;
  const exceedsCap =
    limits?.activation_cap?.active === true &&
    parsedAmount > 0 &&
    parsedAmount * 100 > (outflowRemaining ?? Infinity);

  // Block outflow above the available balance (amount + flat transfer fee).
  // Balance is naira (not kobo), so compare directly. Fail-open if the summary
  // hasn't loaded yet.
  const exceedsBalance =
    accountSummary?.available_balance != null &&
    parsedAmount > 0 &&
    parsedAmount + TRANSFER_FEE > accountSummary.available_balance;

  const canProceed =
    !exceedsCap &&
    !exceedsBalance &&
    (activeTab === 'neatpay'
      ? accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
        accountName !== '' &&
        parsedAmount > 0
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
      store.setBank(NEAT_BANK_CODE, 'Neatpay');
    }
    store.setAccountDetails(accountNumber, accountName);
    store.setAmount(amount);
    store.setNarration(narration);
    store.setSenderPhone(user?.phone ?? '');
    store.setSenderName(accountSummary?.full_name ?? '');
    router.push('/(transfer)/transfer-review');
  };

  const handleSelectBeneficiary = async (beneficiary: Beneficiary) => {
    prefilled.current = true;
    setAccountNumber(beneficiary.account_number);
    setAccountName(beneficiary.account_name);
    setBeneficiaryModalVisible(false);
    setBeneficiarySearch('');

    if (activeTab === 'other_bank') {
      // Ternary, not an unconditional `await fetchBanks()`. When banks are
      // already cached this must not yield: staying synchronous keeps all the
      // setters in one batch, so the validation effect runs once and consumes
      // `prefilled` — which is what preserves "trust the saved name". Awaiting
      // here would split the batch and re-validate every beneficiary pick.
      const bankList = banks.length > 0 ? banks : await fetchBanks();
      setSelectedBank(resolveBank(beneficiary.bank_code, bankList));
    }
  };

  // Escape hatch for a prefilled recipient that fails validation. Locked fields
  // would otherwise be a dead end. This lifts the *lock* rather than making the
  // prefilled fields editable, so a prefilled recipient is still never edited —
  // the screen just reverts to a blank Send Money.
  const handleClearPrefill = () => {
    setLockedRecipient(false);
    setAccountNumber('');
    setAccountName('');
    setValidationError('');
    setSelectedBank(null);
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

        {/* CBN 24h activation cap disclosure (renders only when active) */}
        <ActivationCapBanner limits={limits} />

        {/* Transfer Type label */}
        <Text className="text-sm font-semibold text-[#1A1A1A] mb-6">
          Transfer to:
        </Text>

        {/* Tab pills */}
        {/* When locked, render only the active pill. Switching tabs would fire
            the reset effect and wipe the prefill, and a disabled-but-visible
            second pill is a dead affordance — a lone pill reads as a label. */}
        <View className="flex-row bg-[#F3F3F4] rounded-full py-3 px-3 mb-6">
          {TABS.filter(
            (tab) => !lockedRecipient || tab.key === activeTab,
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 rounded-full items-center ${
                activeTab === tab.key ? 'bg-[#472FF8]' : ''
              }`}
              onPress={() => {
                setActiveTab(tab.key);
                if (tab.key === 'other_bank') fetchBanks();
              }}
              disabled={lockedRecipient}
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
                disabled={lockedRecipient}
                activeOpacity={lockedRecipient ? 1 : 0.2}
              >
                <Text
                  className={`text-[15px] ${
                    selectedBank ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {selectedBank?.name ??
                    (lockedRecipient ? '' : 'Select a bank')}
                </Text>
                {/* Chevron promises a picker; a lock explains its absence. */}
                {lockedRecipient && !selectedBank && banksLoading ? (
                  <ActivityIndicator size="small" color="#472FF8" />
                ) : (
                  <MaterialCommunityIcons
                    name={lockedRecipient ? 'lock-outline' : 'chevron-down'}
                    size={lockedRecipient ? 18 : 20}
                    color="#9CA3AF"
                  />
                )}
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
              {/* Keep the text colour explicit: on Android an editable={false}
                  input renders dimmed, which would read as broken rather than
                  intentionally locked. The lock icon carries that meaning. */}
              <TextInput
                className="flex-1 text-[15px] text-[#1A1A1A] p-0"
                value={accountNumber}
                onChangeText={(t) =>
                  setAccountNumber(t.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH))
                }
                editable={!lockedRecipient}
                placeholder="Enter account number"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={ACCOUNT_NUMBER_LENGTH}
              />
              {validating && <ActivityIndicator size="small" color="#472FF8" />}
              {lockedRecipient && !validating && (
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={16}
                  color="#9CA3AF"
                />
              )}
            </View>
            {displayName !== '' && (
              <Text
                className={`text-[13px] mt-1.5 font-medium ${
                  accountName !== '' ? 'text-[#16A34A]' : 'text-[#6B7280]'
                }`}
              >
                {displayName}
              </Text>
            )}
            {validationError !== '' && (
              <Text className="text-xs text-red-500 mt-1.5">
                {validationError}
              </Text>
            )}
            {lockedRecipient && validationError !== '' && (
              <TouchableOpacity className="mt-2" onPress={handleClearPrefill}>
                <Text className="text-[13px] font-medium text-[#472FF8]">
                  Send to a different account
                </Text>
              </TouchableOpacity>
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
            {exceedsCap && outflowRemaining != null && (
              <Text className="text-xs text-red-500 mt-1.5">
                Exceeds your remaining {formatNairaShort(outflowRemaining)}{' '}
                24-hour limit.
              </Text>
            )}
            {exceedsBalance && (
              <Text className="text-xs text-red-500 mt-1.5">
                {INSUFFICIENT_FUNDS_MESSAGE}
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
