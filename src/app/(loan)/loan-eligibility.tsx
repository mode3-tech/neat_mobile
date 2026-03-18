import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useLoanStore } from '@/stores/loan.store';

const BENEFITS = [
  'Instant disbursement to your account',
  'Flexible repayment tenure',
  'Competitive interest rates',
  'No hidden charges',
];

export default function LoanEligibilityScreen() {
  const eligibleAmount = useLoanStore((s) => s.eligibleAmount);
  const displayAmount = eligibleAmount || 500000;

  const formattedAmount = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount);

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-5">Loan Eligibility</Text>

      <View className="bg-[#472FF8] rounded-2xl p-6 mb-8">
        <Text className="text-[13px] text-white/80 mb-2">You're eligible for up to</Text>
        <Text className="text-[26px] font-bold text-white">NGN {formattedAmount}</Text>
      </View>

      <View className="gap-4">
        {BENEFITS.map((benefit) => (
          <View key={benefit} className="flex-row items-start gap-3">
            <Text className="text-lg text-[#1A1A1A] leading-[22px]">•</Text>
            <Text className="text-[15px] text-[#1A1A1A] leading-[22px] flex-1">{benefit}</Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      <View className="pb-4">
        <TouchableOpacity
          className="bg-[#472FF8] rounded-full py-4 items-center"
          onPress={() => router.push('/(loan)/apply-loan')}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
