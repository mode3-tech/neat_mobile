import { useEffect } from 'react';
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

export default function LoanSuccessScreen() {
  const summary = useLoanStore((s) => s.summary);
  const reset = useLoanStore((s) => s.reset);

  const handleBack = () => {
    reset();
    router.replace('/(loan)/loan-home');
  };

  useEffect(() => {
    if (!summary) {
      handleBack();
    }
  }, [summary]);

  if (!summary) {
    return null;
  }

  const frequencyLabel =
    summary.repayment_frequency.charAt(0).toUpperCase() +
    summary.repayment_frequency.slice(1);

  const rows = [
    { label: 'Loan Amount', value: formatCurrency(summary.loan_amount) },
    { label: 'Total Repayment', value: formatCurrency(summary.total_repayment) },
    { label: `${frequencyLabel} Payment`, value: formatCurrency(summary.periodic_repayment) },
    { label: 'Interest Amount', value: formatCurrency(summary.interest_amount) },
    { label: 'Interest Rate', value: `${summary.interest_rate_percent}%` },
    { label: 'Loan Term', value: `${summary.loan_term_value} weeks` },
    { label: 'Business Age', value: `${summary.business_age_years} years` },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <ScrollView showsVerticalScrollIndicator={false} className="pt-10">
        <View className="items-center mb-5">
          <View className="w-16 h-16 rounded-full bg-[#16A34A] items-center justify-center">
            <MaterialCommunityIcons name="check" size={32} color="#fff" />
          </View>
        </View>

        <Text className="text-[22px] font-bold text-[#1A1A1A] text-center mb-2">
          Loan Application Successful
        </Text>
        <Text className="text-[13px] text-[#6B7280] text-center leading-5 mb-7">
          You will be notified once the loan is{'\n'}approved and disbursed.
        </Text>

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
      </ScrollView>

      <View className="pb-4">
        <TouchableOpacity
          className="bg-[#472FF8] rounded-full py-4 items-center"
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Back to Loans</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
