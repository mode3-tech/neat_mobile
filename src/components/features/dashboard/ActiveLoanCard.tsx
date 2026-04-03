import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ActiveLoan } from '@/types/account.types';
import { formatNairaWhole } from '@/utils/format';

interface ActiveLoanCardProps {
  loans: ActiveLoan[];
}

export default function ActiveLoanCard({ loans }: ActiveLoanCardProps) {
  if (loans.length === 0) return null;

  const loan = loans[0];

  const rows = [
    { label: 'Loan Amount', value: formatNairaWhole(loan.loan_amount) },
    { label: 'Total Repayment', value: formatNairaWhole(loan.total_repayment) },
    { label: 'Monthly Payment', value: formatNairaWhole(loan.monthly_repayment) },
  ];

  return (
    <View className="mx-6 mt-5">
      <Text className="text-base font-semibold text-gray-900 mb-2">Active Loan</Text>

      <View className="bg-[#472FF8] rounded-2xl p-5">
        {/* Arrow icon */}
        <View className="w-10 h-10 rounded-full bg-black/20 items-center justify-center mb-4">
          <Ionicons name="arrow-forward" size={20} color="white" />
        </View>

        {/* Loan details */}
        <View className="gap-3">
          {rows.map((row) => (
            <View key={row.label} className="flex-row justify-between items-center">
              <Text className="text-white/80 text-sm">{row.label}</Text>
              <Text className="text-white text-sm font-semibold">{row.value}</Text>
            </View>
          ))}
        </View>

        {/* View Settlement button */}
        <TouchableOpacity
          className="bg-[#00BFA6] rounded-full py-3 px-6 self-start mt-5"
          activeOpacity={0.85}
        >
          <Text className="text-white text-sm font-semibold">View Settlement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
