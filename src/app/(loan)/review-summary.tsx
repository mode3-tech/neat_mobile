import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useLoanStore } from '@/stores/loan.store';

function formatCurrency(amount: number): string {
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export default function ReviewSummaryScreen() {
  const store = useLoanStore();

  const loanAmount = parseFloat(store.loanAmount) || 0;
  const interestRate = store.interestRateBps;
  const loanTerm = store.loanTermValue;
  const totalRepayment = Math.round(loanAmount * (1 + interestRate / 100) * 100) / 100;
  const periodPayment = loanTerm > 0
    ? Math.round((totalRepayment / loanTerm) * 100) / 100
    : 0;

  const rows = [
    { label: 'Business Value', value: store.businessValue },
    { label: 'Age of Business', value: store.businessAge },
    { label: 'Loan Amount', value: formatCurrency(loanAmount) },
    { label: 'Total Repayment', value: formatCurrency(totalRepayment) },
    { label: `${store.repaymentFrequency} Payment`, value: formatCurrency(periodPayment) },
    { label: 'Loan Term', value: String(loanTerm) },
    { label: 'Interest Rate', value: `${interestRate}%` },
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
        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Review Summary</Text>

        <View className="border border-[#E5E7EB] rounded-[14px] px-4 mb-5">
          {rows.map((row, i) => (
            <SummaryRow
              key={row.label}
              label={row.label}
              value={row.value}
              isLast={i === rows.length - 1}
            />
          ))}
        </View>

        <View className="flex-row items-center bg-[#F9FAFB] rounded-[14px] p-4 gap-[14px] mb-6">
          <View className="w-11 h-11 rounded-full bg-[#EEF0FF] items-center justify-center">
            <MaterialCommunityIcons name="home" size={22} color="#472FF8" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-[#374151] mb-1">Business Address</Text>
            <Text className="text-xs text-[#6B7280] leading-[18px]">{store.businessAddress}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="pb-4 gap-3">
        <TouchableOpacity
          className="bg-[#472FF8] rounded-full py-4 items-center"
          onPress={() => router.push('/(loan)/loan-pin')}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Accept & continue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border-[1.5px] border-[#472FF8] rounded-full py-4 items-center"
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text className="text-[#472FF8] text-base font-semibold">Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
