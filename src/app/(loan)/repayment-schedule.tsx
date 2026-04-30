import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useQuery } from '@tanstack/react-query';

import { PIN_LENGTH, QUERY_KEYS } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { loanService } from '@/services/loan.service';
import { formatDateLong } from '@/utils/format';
import type { LoanHistoryItem, LoanHistoryStatus } from '@/types/loan.types';

function formatCurrency(amount: number): string {
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function SummaryRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-[14px] ${!isLast ? 'border-b border-[#F3F4F6]' : ''}`}>
      <Text className="text-[13px] text-[#6B7280]">{label}</Text>
      <Text className="text-sm font-semibold text-[#1A1A1A]">{value}</Text>
    </View>
  );
}

function statusLabel(s: LoanHistoryStatus) {
  return s === 'paid' ? 'Paid' : s === 'overdue' ? 'Overdue' : 'Pending';
}

function statusColorClass(s: LoanHistoryStatus) {
  return s === 'paid'
    ? 'text-[#16A34A]'
    : s === 'overdue'
    ? 'text-[#EF4444]'
    : 'text-[#F59E0B]';
}

function ScheduleRow({
  item,
  index,
  isNextUpcoming,
}: {
  item: LoanHistoryItem;
  index: number;
  isNextUpcoming: boolean;
}) {
  const highlight =
    item.status === 'overdue'
      ? 'bg-[#FEF2F2] border border-[#FECACA]'
      : isNextUpcoming
      ? 'bg-[#FFF7ED] border border-[#FED7AA]'
      : 'bg-[#F9FAFB]';
  const iconBg =
    item.status === 'overdue'
      ? 'bg-[#FEE2E2]'
      : isNextUpcoming
      ? 'bg-[#FFEDD5]'
      : 'bg-[#EEF0FF]';
  const iconColor =
    item.status === 'overdue' ? '#EF4444' : isNextUpcoming ? '#F59E0B' : '#472FF8';
  return (
    <View className={`flex-row items-center justify-between rounded-2xl px-4 py-3 mb-3 ${highlight}`}>
      <View className="flex-row items-center gap-3">
        <View className={`w-9 h-9 rounded-lg items-center justify-center ${iconBg}`}>
          <MaterialCommunityIcons name="cube-outline" size={18} color={iconColor} />
        </View>
        <View>
          <Text className="text-[13px] font-semibold text-[#1A1A1A]">Week {index + 1}</Text>
          <Text className="text-xs text-[#6B7280] mt-0.5">{formatDateLong(item.payment_date)}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-[#1A1A1A]">
          {formatCurrency(item.status === 'paid' ? item.amount_paid : item.loan_amount)}
        </Text>
        <Text className={`text-xs ${statusColorClass(item.status)}`}>{statusLabel(item.status)}</Text>
      </View>
    </View>
  );
}

export default function RepaymentScheduleScreen() {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();

  const {
    data: repayment,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [QUERY_KEYS.REPAYMENT, loanId],
    queryFn: () => loanService.getRepaymentSchedule(loanId!),
    enabled: !!loanId,
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOAN_HISTORY_BY_ID, loanId],
    queryFn: () => loanService.getLoanHistoryById(loanId!),
    enabled: !!loanId,
  });

  const {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  } = useBiometricAuth();

  const [modalType, setModalType] = useState<'now' | 'early' | null>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const openModal = (type: 'now' | 'early') => {
    if (!repayment) return;
    const prefill = type === 'now' ? repayment.periodic_repayment : repayment.yet_to_pay;
    setAmount(prefill.toFixed(2));
    setPin('');
    setShowPin(false);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setAmount('');
    setPin('');
    setShowPin(false);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const yetToPay = repayment?.yet_to_pay ?? 0;
  const balance = modalType === 'early' ? 0 : Math.max(yetToPay - parsedAmount, 0);
  const canConfirm = parsedAmount > 0 && pin.length === PIN_LENGTH;

  const paidPercent = repayment && repayment.total_repayment > 0
    ? Math.min(100, Math.max(0, Math.round((repayment.amount_paid / repayment.total_repayment) * 100)))
    : 0;
  const remainingPercent = 100 - paidPercent;

  const rows = repayment
    ? [
        { label: 'Loan Product Type', value: repayment.loan_product_type },
        { label: 'Loan Amount', value: formatCurrency(repayment.loan_amount) },
        { label: 'Total Repayment', value: formatCurrency(repayment.total_repayment) },
        { label: 'Periodic Repayment', value: formatCurrency(repayment.periodic_repayment) },
        { label: 'Loan Duration', value: repayment.loan_duration },
        { label: 'Interest Rate', value: `${repayment.interest_rate}%` },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-5">Repayment Schedule</Text>

        {isLoading && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="small" color="#472FF8" />
          </View>
        )}

        {!isLoading && (!loanId || isError || !repayment) && (
          <View className="py-20 items-center justify-center px-6">
            <MaterialCommunityIcons
              name={!loanId ? 'file-document-outline' : 'alert-circle-outline'}
              size={64}
              color="#E5E7EB"
            />
            <Text className="text-base font-semibold text-[#1A1A1A] mt-3">
              {!loanId ? 'No active loan' : "Couldn't load repayment details"}
            </Text>
            <Text className="text-[13px] text-[#6B7280] mt-1 text-center">
              {!loanId
                ? 'You have no active loan to show a repayment schedule for.'
                : 'Please check your connection and try again.'}
            </Text>
          </View>
        )}

        {!isLoading && repayment && (
          <>
            {/* Summary Cards */}
            <View className="flex-row gap-3 mb-6">
              {/* Amount Paid Card */}
              <View className="flex-1 rounded-2xl p-4 bg-[#ECFDF5]">
                <View className="w-9 h-9 rounded-xl bg-[#D1FAE5] items-center justify-center mb-3">
                  <MaterialCommunityIcons name="wallet-outline" size={20} color="#472FF8" />
                </View>
                <Text className="text-xs text-[#6B7280] mb-1">Amount paid</Text>
                <Text className="text-[18px] font-bold text-[#1A1A1A]">
                  {formatCurrency(repayment.amount_paid)}
                </Text>
                <Text className="text-[11px] text-[#6B7280] mt-0.5">
                  {paidPercent}% Paid
                </Text>
              </View>

              {/* Yet to Pay Card */}
              <View className="flex-1 rounded-2xl p-4 bg-[#F3E8FF]">
                <View className="w-9 h-9 rounded-xl bg-[#E9D5FF] items-center justify-center mb-3">
                  <MaterialCommunityIcons name="cash-clock" size={20} color="#7C3AED" />
                </View>
                <Text className="text-xs text-[#6B7280] mb-1">Yet to Pay</Text>
                <Text className="text-[18px] font-bold text-[#1A1A1A]">
                  {formatCurrency(repayment.yet_to_pay)}
                </Text>
                <Text className="text-[11px] text-[#6B7280] mt-0.5">
                  {remainingPercent}% remaining
                </Text>
              </View>
            </View>

            {/* Loan Details Table */}
            <View className="border border-[#E5E7EB] rounded-[14px] px-4 mb-6">
              {rows.map((row, i) => (
                <SummaryRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={i === rows.length - 1}
                />
              ))}
            </View>

            {/* Payment Schedule */}
            <Text className="text-base font-bold text-[#1A1A1A] mb-3">Payment Schedule</Text>
            {scheduleLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#472FF8" />
              </View>
            ) : (schedule?.length ?? 0) === 0 ? (
              <Text className="text-[13px] text-[#6B7280] mb-6">No scheduled payments yet.</Text>
            ) : (
              <View className="mb-6">
                {(() => {
                  const nextUpcomingIdx = schedule!.findIndex(
                    (it) => it.status !== 'paid' && it.status !== 'overdue',
                  );
                  return schedule!.map((item, i) => (
                    <ScheduleRow
                      key={`${item.loan_id}-${item.payment_date}-${i}`}
                      item={item}
                      index={i}
                      isNextUpcoming={i === nextUpcomingIdx}
                    />
                  ));
                })()}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Buttons — temporarily disabled; repayment now lives on loan-home.tsx */}
      {/* {!isLoading && repayment && (
        <View className="pb-4 gap-3">
          <TouchableOpacity
            className="bg-[#472FF8] rounded-full py-4 items-center"
            activeOpacity={0.85}
            onPress={() => openModal('now')}
          >
            <Text className="text-white text-base font-semibold">Pay Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border-[1.5px] border-[#472FF8] rounded-full py-4 items-center"
            activeOpacity={0.85}
            onPress={() => openModal('early')}
          >
            <Text className="text-[#472FF8] text-base font-semibold">Pay Off Early</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* Payment Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAwareScrollView
            contentContainerClassName="flex-1 justify-end"
            bounces={false}
          >
            <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16">
              {/* Drag handle */}
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
              <Text className="text-xs mb-5">
                <Text className="text-[#6B7280]">Balance: </Text>
                <Text className="text-[#472FF8] font-medium">
                  {formatCurrency(balance)}
                </Text>
              </Text>

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

              {/* Confirm + Biometric */}
              <View className="flex-row items-center gap-3 mb-3">
                <TouchableOpacity
                  className={`flex-1 rounded-full py-4 items-center ${canConfirm ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
                  onPress={async () => {
                    if (canConfirm) {
                      await onManualPinSuccess(pin);
                      closeModal();
                    }
                  }}
                  disabled={!canConfirm}
                  activeOpacity={0.85}
                >
                  <Text className={`text-base font-semibold ${canConfirm ? 'text-white' : 'text-[#9CA3AF]'}`}>
                    Confirm
                  </Text>
                </TouchableOpacity>

                {isBiometricReady && (
                  <TouchableOpacity
                    className="w-14 h-14 rounded-full border border-[#E5E7EB] items-center justify-center"
                    activeOpacity={0.7}
                    onPress={async () => {
                      if (authenticating) return;
                      const storedPin = await authenticateWithBiometric();
                      if (storedPin) {
                        // TODO: submit payment API call with storedPin when endpoint is ready
                        closeModal();
                      }
                    }}
                    disabled={authenticating}
                  >
                    <MaterialCommunityIcons
                      name={biometryType === 'FACE' ? 'face-recognition' : 'fingerprint'}
                      size={28}
                      color="#472FF8"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Cancel */}
              <TouchableOpacity
                className="border-[1.5px] border-[#472FF8] rounded-full py-4 items-center"
                onPress={closeModal}
                activeOpacity={0.85}
              >
                <Text className="text-[#472FF8] text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
