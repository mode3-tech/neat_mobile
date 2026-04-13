import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

import { accountService } from '@/services/account.service';

export default function BankTransferScreen() {
  const { data: accountSummary } = useQuery({
    queryKey: ['account-summary'],
    queryFn: accountService.getSummary,
  });

  const copyAccountNumber = () => {
    if (accountSummary?.account_number) {
      Clipboard.setStringAsync(accountSummary.account_number);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] text-center mb-1.5">
        Transfer to Your Account
      </Text>
      <Text className="text-[13px] text-[#6B7280] text-center leading-5 mb-8">
        Use these details to complete your{'\n'}deposit
      </Text>

      <View className="bg-[#F6F5F8] rounded-[14px] px-5 py-6 items-center">
        <Text className="text-[13px] text-[#6B7280] mb-1">Bank</Text>
        <Text className="text-[17px] font-bold text-[#1A1A1A] mb-5">
          {accountSummary?.bank_name ?? '---'}
        </Text>

        <Text className="text-[13px] text-[#6B7280] mb-1">Account Number</Text>
        <View className="flex-row items-center mb-5">
          <Text className="text-[17px] font-bold text-[#472FF8] mr-2">
            {accountSummary?.account_number ?? '---'}
          </Text>
          <TouchableOpacity onPress={copyAccountNumber} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons
              name="content-copy"
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        <Text className="text-[13px] text-[#6B7280] mb-1">Account Name</Text>
        <Text className="text-[17px] font-bold text-[#1A1A1A]">
          Neatpay Savings
        </Text>
      </View>

      <Text className="text-[13px] text-[#E59501] text-center mt-6">
        Transfers usually reflect within 5 minutes
      </Text>
    </SafeAreaView>
  );
}
