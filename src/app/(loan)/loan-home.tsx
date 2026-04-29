import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { loanService } from '@/services/loan.service';
import { accountService } from '@/services/account.service';
import { PIN_LENGTH, QUERY_KEYS } from '@/constants';
import { formatNairaWhole } from '@/utils/format';
import type { ActiveLoan } from '@/types/loan.types';

interface ActionItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

function formatCurrency(amount: number): string {
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ActionItem({ icon, label, onPress, disabled }: ActionItemProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between rounded-[14px] px-4 py-[18px] ${
        disabled ? 'bg-[#F3F4F6]' : 'bg-[#F9FAFB]'
      }`}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View className="flex-row items-center gap-[14px]">
        <Text className={`text-xl ${disabled ? 'opacity-40' : ''}`}>{icon}</Text>
        <Text
          className={`text-[15px] font-medium ${
            disabled ? 'text-[#9CA3AF]' : 'text-[#1A1A1A]'
          }`}
        >
          {label}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={disabled ? '#D1D5DB' : '#472FF8'}
      />
    </TouchableOpacity>
  );
}

function EmptyBalanceCard() {
  return (
    <View className="bg-[#472FF8] rounded-2xl p-6 mb-7 flex-row items-center justify-between">
      <View>
        <Text className="text-sm text-white/80 mb-2">Outstanding Balance</Text>
        <Text className="text-[28px] font-bold text-white">₦ 0.00</Text>
      </View>
      <Image
        source={require('../../../assets/images/pig.png')}
        className="w-[100px] h-[100px]"
        resizeMode="contain"
      />
    </View>
  );
}

function ActiveBalanceCard({ loan, onMakeRepayment }: { loan: ActiveLoan; onMakeRepayment: () => void }) {
  return (
    <View className="bg-[#472FF8] rounded-2xl p-6 mb-7">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm text-white/80 mb-2">Outstanding Balance</Text>
          <Text className="text-[28px] font-bold text-white">
            {formatNairaWhole(loan.outstanding_balance)}
          </Text>
        </View>
        <Image
          source={require('../../../assets/images/pig.png')}
          className="w-[80px] h-[80px]"
          resizeMode="contain"
        />
      </View>

      <View className="flex-row mt-5 mb-5">
        <View className="flex-1">
          <Text className="text-xs text-white/80 mb-1">Next Payment</Text>
          <Text className="text-sm font-semibold text-white">
            {formatNairaWhole(loan.next_payment)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-white/80 mb-1">Due Date</Text>
          <Text className="text-sm font-semibold text-white">
            {loan.due_date}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="bg-white rounded-full py-3.5 items-center"
        activeOpacity={0.8}
        onPress={onMakeRepayment}
      >
        <Text className="text-[15px] font-semibold text-[#472FF8]">Make Repayment</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LoanHomeScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: loanService.getActiveLoans,
  });

  const { data: accountSummary, isLoading: isAccountLoading } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  const loan = data?.[0];
  const hasLoan = !!loan;
  const activeLoanId = accountSummary?.active_loans?.[0]?.loan_id;
  const availableBalance = accountSummary?.available_balance ?? 0;
  const canOpenRepayment = !!loan && !isAccountLoading;

  const [paymentVisible, setPaymentVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const { mutate: submitRepayment, isPending } = useMutation({
    mutationFn: loanService.submitRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      closePaymentModal();
      setSuccessVisible(true);
    },
    onError: (err: Error) => {
      toast.error('Repayment failed', {
        description: err.message || 'Please try again.',
      });
    },
  });

  const openPaymentModal = () => {
    if (!canOpenRepayment || !loan) return;
    setAmount('');
    setPin('');
    setShowPin(false);
    setPaymentVisible(true);
  };

  const closePaymentModal = () => {
    setPaymentVisible(false);
    setAmount('');
    setPin('');
    setShowPin(false);
  };

  const parsedAmount = parseFloat(amount) || 0;
  // Temporarily disabled for testing the repayment endpoint
  // const exceedsBalance = parsedAmount > availableBalance;
  const exceedsBalance = false;
  const hasValidInput =
    parsedAmount > 0 && /* !exceedsBalance && */ pin.length === PIN_LENGTH;
  const canConfirm = hasValidInput && !isPending;

  const onConfirm = () => {
    if (!canConfirm || !loan) return;
    submitRepayment({
      loan_id: loan.loan_id,
      amount: parsedAmount,
      transaction_pin: pin,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1">Loans</Text>
      <Text className="text-[13px] text-[#6B7280] mb-5">Manage your loans and applications</Text>

      {isLoading ? (
        <View className="h-[180px] items-center justify-center mb-7">
          <ActivityIndicator size="small" color="#472FF8" />
        </View>
      ) : hasLoan ? (
        <ActiveBalanceCard loan={loan} onMakeRepayment={openPaymentModal} />
      ) : (
        <EmptyBalanceCard />
      )}

      <View className="gap-3">
        <ActionItem
          icon="📋"
          label="Apply New Loan"
          onPress={() => router.push('/(loan)/loan-eligibility')}
        />
        <ActionItem
          icon="📅"
          label="Repayment Schedule"
          disabled={!activeLoanId}
          onPress={() => {
            if (!activeLoanId) return;
            router.push({
              pathname: '/(loan)/repayment-schedule',
              params: { loanId: activeLoanId },
            });
          }}
        />
        <ActionItem
          icon="📊"
          label="Loan Status"
          onPress={() => router.push('/(loan)/loan-status')}
        />
        <ActionItem
          icon="💰"
          label="Loan History"
          onPress={() => router.push('/(loan)/loan-history')}
        />
      </View>

      {/* Payment Modal */}
      <Modal
        visible={paymentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isPending) closePaymentModal();
        }}
      >
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAwareScrollView
            contentContainerClassName="flex-1 justify-end"
            bounces={false}
          >
            <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16">
              <View className="w-10 h-1 rounded-full bg-[#D1D5DB] self-center mb-5" />

              <Text className="text-xl font-bold text-[#1A1A1A] text-center mb-6">
                Make Payment
              </Text>

              {/* Amount */}
              <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Amount</Text>
              <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-1.5">
                <TextInput
                  className="text-[15px] text-[#1A1A1A] p-0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {exceedsBalance ? (
                <Text className="text-xs text-[#EF4444] mb-5">
                  Amount exceeds available balance
                </Text>
              ) : (
                <Text className="text-xs mb-5">
                  <Text className="text-[#6B7280]">Balance: </Text>
                  <Text className="text-[#472FF8] font-medium">
                    {formatCurrency(availableBalance)}
                  </Text>
                </Text>
              )}

              {/* PIN */}
              <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Enter PIN</Text>
              <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-8 flex-row items-center">
                <TextInput
                  className="flex-1 text-[15px] text-[#1A1A1A] p-0"
                  value={pin}
                  onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH))}
                  placeholder="••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={PIN_LENGTH}
                />
                <TouchableOpacity onPress={() => setShowPin((v) => !v)}>
                  <MaterialCommunityIcons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm */}
              <TouchableOpacity
                className={`rounded-full py-4 items-center mb-3 ${
                  hasValidInput ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'
                }`}
                onPress={onConfirm}
                disabled={!canConfirm}
                activeOpacity={0.85}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className={`text-base font-semibold ${
                      hasValidInput ? 'text-white' : 'text-[#9CA3AF]'
                    }`}
                  >
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                className="border-[1.5px] border-[#472FF8] rounded-full py-4 items-center"
                onPress={closePaymentModal}
                activeOpacity={0.85}
                disabled={isPending}
              >
                <Text className="text-[#472FF8] text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16 items-center">
            <View className="w-10 h-1 rounded-full bg-[#D1D5DB] self-center mb-8" />

            <MaterialCommunityIcons
              name="check-decagram"
              size={72}
              color="#16A34A"
            />

            <Text className="text-xl font-bold text-[#1A1A1A] mt-4 mb-8">
              Payment Successful!
            </Text>

            <TouchableOpacity
              className="bg-[#472FF8] rounded-full py-4 items-center w-full"
              onPress={() => setSuccessVisible(false)}
              activeOpacity={0.85}
            >
              <Text className="text-white text-base font-semibold">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
