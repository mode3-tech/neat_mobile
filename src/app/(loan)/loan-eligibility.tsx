import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HeaderScreen } from '@/components/ui/header-screen';
import { router } from 'expo-router';

import { useLoanStore } from '@/stores/loan.store';
import { BackButton } from '@/components/ui/back-button';

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
    <HeaderScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-5">
        <BackButton className="" />
        <Text
          className="text-[22px] font-bold text-[#1A1A1A] leading-[26px]"
          style={{ includeFontPadding: false }}
        >
          Loan Eligibility
        </Text>
      </View>

      <View className="bg-[#032252] rounded-2xl p-6 mb-8">
        <Text className="text-[13px] text-white mb-2">You're eligible for up to</Text>
        <Text className="text-[26px] font-bold text-white">NGN {formattedAmount}</Text>
      </View>

      <View className="gap-4">
        {BENEFITS.map((benefit) => (
          <View key={benefit} className="flex-row items-start gap-3">
            <Text className="text-lg text-[#032252] leading-[22px]">•</Text>
            <Text className="text-[15px] text-[#032252] leading-[22px] flex-1">{benefit}</Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      <View className="pb-4">
        <TouchableOpacity
          className="bg-[#F9B700] rounded-full py-4 items-center"
          onPress={() => router.push('/(loan)/apply-loan')}
          activeOpacity={0.85}
        >
          <Text className="text-[#032252] text-base font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    </HeaderScreen>
  );
}
