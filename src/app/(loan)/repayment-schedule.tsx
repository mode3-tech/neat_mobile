import { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { PIN_LENGTH } from '@/constants';

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

const LOAN_DETAILS = {
  productType: 'Rice Loan',
  loanAmount: 80000,
  totalRepayment: 82304,
  weeklyPayment: 3429.33,
  loanDuration: '24 weeks',
  interestRate: '0.12%',
  amountPaid: 11000,
  yetToPay: 57500,
  paidPercent: 0,
  remainingPercent: 100,
};

interface ScheduleItem {
  week: number;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
}

const PAYMENT_SCHEDULE: ScheduleItem[] = [
  { week: 1, date: 'March 21, 2026', amount: 3429.33, status: 'paid' },
  { week: 2, date: 'April 21, 2026', amount: 3429.33, status: 'paid' },
  { week: 3, date: 'May 21, 2026', amount: 3429.33, status: 'pending' },
];

function TimelineItem({ item, isLast }: { item: ScheduleItem; isLast: boolean }) {
  const isPaid = item.status === 'paid';
  const isPending = item.status === 'pending';

  return (
    <View className="flex-row">
      {/* Timeline column */}
      <View className="items-center mr-3 w-5">
        <View
          className={`w-3 h-3 rounded-full mt-1 ${isPaid ? 'bg-[#22C55E]' : 'bg-[#472FF8]'}`}
        />
        {!isLast && (
          <View className="w-[1.5px] flex-1 bg-[#E5E7EB] my-1" />
        )}
      </View>

      {/* Content */}
      <View
        className={`flex-1 mb-4 rounded-xl px-4 py-3 ${
          isPending
            ? 'bg-[#F5F3FF] border-l-[3px] border-l-[#472FF8]'
            : 'bg-transparent'
        }`}
      >
        <View className="flex-row justify-between items-start">
          <View>
            <Text className={`text-xs mb-0.5 ${isPaid ? 'text-[#6B7280]' : 'text-[#472FF8] font-medium'}`}>
              Week {item.week}
            </Text>
            <Text className="text-[13px] font-medium text-[#1A1A1A]">{item.date}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[13px] font-semibold text-[#1A1A1A]">
              {formatCurrency(item.amount)}
            </Text>
            <Text
              className={`text-xs mt-0.5 ${
                isPaid ? 'text-[#22C55E]' : 'text-[#472FF8]'
              }`}
            >
              {isPaid ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RepaymentScheduleScreen() {
  const [modalType, setModalType] = useState<'now' | 'early' | null>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const openModal = (type: 'now' | 'early') => {
    const prefill = type === 'now' ? LOAN_DETAILS.weeklyPayment : LOAN_DETAILS.yetToPay;
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
  const balance = modalType === 'early' ? 0 : Math.max(LOAN_DETAILS.yetToPay - parsedAmount, 0);
  const canConfirm = parsedAmount > 0 && pin.length === PIN_LENGTH;

  const rows = [
    { label: 'Loan Product Type', value: LOAN_DETAILS.productType },
    { label: 'Loan Amount', value: formatCurrency(LOAN_DETAILS.loanAmount) },
    { label: 'Total Repayment', value: formatCurrency(LOAN_DETAILS.totalRepayment) },
    { label: 'Weekly Payment', value: formatCurrency(LOAN_DETAILS.weeklyPayment) },
    { label: 'Loan Duration', value: LOAN_DETAILS.loanDuration },
    { label: 'Interest Rate', value: LOAN_DETAILS.interestRate },
  ];

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

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-6">
          {/* Amount Paid Card */}
          <View className="flex-1 rounded-2xl p-4 bg-[#ECFDF5]">
            <View className="w-9 h-9 rounded-xl bg-[#D1FAE5] items-center justify-center mb-3">
              <MaterialCommunityIcons name="wallet-outline" size={20} color="#472FF8" />
            </View>
            <Text className="text-xs text-[#6B7280] mb-1">Amount paid</Text>
            <Text className="text-[18px] font-bold text-[#1A1A1A]">
              {formatCurrency(LOAN_DETAILS.amountPaid)}
            </Text>
            <Text className="text-[11px] text-[#6B7280] mt-0.5">
              {LOAN_DETAILS.paidPercent}% Paid
            </Text>
          </View>

          {/* Yet to Pay Card */}
          <View className="flex-1 rounded-2xl p-4 bg-[#F3E8FF]">
            <View className="w-9 h-9 rounded-xl bg-[#E9D5FF] items-center justify-center mb-3">
              <MaterialCommunityIcons name="cash-clock" size={20} color="#7C3AED" />
            </View>
            <Text className="text-xs text-[#6B7280] mb-1">Yet to Pay</Text>
            <Text className="text-[18px] font-bold text-[#1A1A1A]">
              {formatCurrency(LOAN_DETAILS.yetToPay)}
            </Text>
            <Text className="text-[11px] text-[#6B7280] mt-0.5">
              {LOAN_DETAILS.remainingPercent}% remaining
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
        <Text className="text-base font-semibold text-[#1A1A1A] mb-4">
          Payment Schedule (Weekly)
        </Text>

        <View className="mb-6">
          {PAYMENT_SCHEDULE.map((item, i) => (
            <TimelineItem
              key={item.week}
              item={item}
              isLast={i === PAYMENT_SCHEDULE.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
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

              {/* Confirm */}
              <TouchableOpacity
                className={`rounded-full py-4 items-center mb-3 ${canConfirm ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
                onPress={() => { if (canConfirm) closeModal(); }}
                disabled={!canConfirm}
                activeOpacity={0.85}
              >
                <Text className={`text-base font-semibold ${canConfirm ? 'text-white' : 'text-[#9CA3AF]'}`}>
                  Confirm
                </Text>
              </TouchableOpacity>

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
