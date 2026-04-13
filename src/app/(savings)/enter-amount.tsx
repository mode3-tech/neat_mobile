import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { accountService } from '@/services/account.service';
import { useSavingsStore } from '@/stores/savings.store';

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
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1">
        Enter Amount
      </Text>
      <Text className="text-[13px] text-[#6B7280] mb-7">
        How much do you want to deposit?
      </Text>

      {/* Balance card */}
      <View className="bg-[#EEF0FF] rounded-xl px-4 py-4 mb-6">
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
          className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text
            className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-[#9CA3AF]'}`}
          >
            Proceed
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
