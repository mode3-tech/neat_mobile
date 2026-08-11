import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

import { accountService } from '@/services/account.service';
import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

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
        className="self-start border border-line rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-ink-body">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-ink text-center mb-1.5">
        Transfer to Your Account
      </Text>
      <Text className="text-[13px] text-ink-soft text-center leading-5 mb-8">
        Use these details to complete your{'\n'}deposit
      </Text>

      <View className="bg-legacy-surface-1 rounded-[14px] px-5 py-6 items-center">
        <Text className="text-[13px] text-ink-soft mb-1">Bank</Text>
        <Text className="text-[17px] font-bold text-ink mb-5">
          {accountSummary?.bank_name ?? '---'}
        </Text>

        <Text className="text-[13px] text-ink-soft mb-1">Account Number</Text>
        <View className="flex-row items-center mb-5">
          <Text className="text-[17px] font-bold text-primary mr-2">
            {accountSummary?.account_number ?? '---'}
          </Text>
          <TouchableOpacity onPress={copyAccountNumber} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon
              name="copy"
              size={18}
              color={colors.inkMuted}
            />
          </TouchableOpacity>
        </View>

        <Text className="text-[13px] text-ink-soft mb-1">Account Name</Text>
        <Text className="text-[17px] font-bold text-ink">
          {accountSummary?.full_name ?? '---'}
        </Text>
      </View>

      <Text className="text-[13px] text-warning-accent text-center mt-6">
        Transfers usually reflect within 5 minutes
      </Text>
    </SafeAreaView>
  );
}
