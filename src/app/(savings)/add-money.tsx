import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { HeaderScreen } from '@/components/ui/header-screen';
import { BackButton } from '@/components/ui/back-button';

interface FundingOption {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}

const FUNDING_OPTIONS: FundingOption[] = [
  {
    icon: 'bank-outline',
    label: 'Bank Transfer',
    description: 'Pay fast and securely.',
    onPress: () => router.push('/(savings)/bank-transfer'),
  },
  {
    icon: 'credit-card-outline',
    label: 'Debit Card',
    description: 'Instant transfer',
    onPress: () =>
      Alert.alert('Coming Soon', 'Debit card deposits will be available soon.'),
  },
  {
    icon: 'wallet-outline',
    label: 'From Main Balance',
    description: 'Transfer from wallet',
    onPress: () => router.push('/(savings)/enter-amount'),
  },
];

export default function AddMoneyScreen() {
  return (
    <HeaderScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-1">
        <BackButton className="" />
        <Text
          className="text-[22px] font-bold text-[#032252] leading-[26px]"
          style={{ includeFontPadding: false }}
        >
          Add Money to Savings
        </Text>
      </View>
      <Text className="text-[13px] text-[#6B7280] mb-7">
        Choose funding method
      </Text>

      <View className="bg-[#E8EEF7] rounded-2xl p-4 gap-3">
        {FUNDING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
            className="flex-row items-center bg-white rounded-xl px-4 py-4"
            activeOpacity={0.7}
            onPress={option.onPress}
          >
            <View className="w-10 h-10 rounded-full bg-[#FDF1CC] items-center justify-center mr-3">
              <MaterialCommunityIcons
                name={option.icon}
                size={20}
                color="#032252"
              />
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-[#1A1A1A]">
                {option.label}
              </Text>
              <Text className="text-[12px] text-[#6B7280] mt-0.5">
                {option.description}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ))}
      </View>
    </HeaderScreen>
  );
}
