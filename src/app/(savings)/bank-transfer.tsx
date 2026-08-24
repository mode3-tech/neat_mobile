import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { accountService } from '@/services/account.service';
import { HeaderScreen } from '@/components/ui/header-screen';
import { BackButton } from '@/components/ui/back-button';
import { CopyButton } from '@/components/ui/copy-button';

export default function BankTransferScreen() {
  const { data: accountSummary } = useQuery({
    queryKey: ['account-summary'],
    queryFn: accountService.getSummary,
  });

  return (
    <HeaderScreen>
      <BackButton className="mt-4 mb-6" />

      <Text className="text-[22px] font-bold text-[#032252] text-center mb-1.5">
        Transfer to Your Account
      </Text>
      <Text className="text-[13px] text-[#6B7280] text-center leading-5 mb-8">
        Use these details to complete your{'\n'}deposit
      </Text>

      <View className="bg-[#F5F5F5] rounded-[14px] px-5 py-6 items-center">
        <Text className="text-[13px] text-[#6B7280] mb-1">Bank</Text>
        <Text className="text-[17px] font-bold text-[#032252] mb-5">
          {accountSummary?.bank_name ?? '---'}
        </Text>

        <Text className="text-[13px] text-[#6B7280] mb-1">Account Number</Text>
        <View className="flex-row items-center mb-5">
          <Text className="text-[17px] font-bold text-[#032252] mr-2">
            {accountSummary?.account_number ?? '---'}
          </Text>
          <CopyButton
            value={accountSummary?.account_number}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={18}
              color="#9CA3AF"
            />
          </CopyButton>
        </View>

        <Text className="text-[13px] text-[#6B7280] mb-1">Account Name</Text>
        <Text className="text-[17px] font-bold text-[#032252]">
          {accountSummary?.full_name ?? '---'}
        </Text>
      </View>

      <Text className="text-[13px] text-[#E59501] text-center mt-6">
        Transfers usually reflect within 5 minutes
      </Text>
    </HeaderScreen>
  );
}
