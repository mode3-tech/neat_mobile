import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { accountService } from '@/services/account.service';
import { useSavingsStore } from '@/stores/savings.store';
import { HeaderScreen } from '@/components/ui/header-screen';
import { BackButton } from '@/components/ui/back-button';

const formatCurrency = (val: number | undefined) =>
  val !== undefined
    ? `₦${new Intl.NumberFormat('en-NG').format(val)}`
    : '₦0.00';

export default function EnterAmountScreen() {
  const store = useSavingsStore();

  const { data: accountSummary } = useQuery({
    queryKey: ['account-summary'],
    queryFn: accountService.getSummary,
  });

  const numericAmount = parseFloat(store.amount) || 0;
  const canProceed =
    numericAmount > 0 &&
    accountSummary?.available_balance !== undefined &&
    numericAmount <= accountSummary.available_balance;

  const handleProceed = () => {
    if (!canProceed) return;
    router.push('/(savings)/savings-pin');
  };

  return (
    <HeaderScreen padded={false}>
      <KeyboardAvoidingView
        className="flex-1 px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-1">
          <BackButton className="" />
          <Text
            className="text-[22px] font-bold text-[#032252] leading-[26px]"
            style={{ includeFontPadding: false }}
          >
            Enter Amount
          </Text>
        </View>
        <Text className="text-[13px] text-[#6B7280] mb-7">
          How much do you want to deposit?
        </Text>

        {/* Balance card */}
        <View className="bg-[#E8EEF7] rounded-xl px-4 py-4 mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-[13px] text-[#374151] font-medium">
              Savings Balance
            </Text>
            <Text className="text-[13px] font-semibold text-[#1A1A1A]">
              ₦0.00
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[13px] text-[#374151] font-medium">
              Main Balance
            </Text>
            <Text className="text-[13px] font-semibold text-[#1A1A1A]">
              {formatCurrency(accountSummary?.available_balance)}
            </Text>
          </View>
        </View>

        {/* Amount input */}
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">
            Amount
          </Text>
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent">
            <TextInput
              className="text-[15px] text-[#1A1A1A] p-0"
              value={store.amount}
              onChangeText={(t) => store.setAmount(t.replace(/\D/g, ''))}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View className="flex-1" />

        {/* Proceed button */}
        <View className="pb-4">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#F9B700]' : 'bg-[#E5E7EB]'}`}
            onPress={handleProceed}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text
              className={`text-base font-semibold ${canProceed ? 'text-[#032252]' : 'text-[#9CA3AF]'}`}
            >
              Proceed
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </HeaderScreen>
  );
}
