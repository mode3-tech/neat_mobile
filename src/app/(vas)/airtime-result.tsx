import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HeaderScreen } from '@/components/ui/header-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useVasStore } from '@/stores/vas.store';
import TransactionSummaryCard from '@/components/features/vas/TransactionSummaryCard';
import { CopyButton } from '@/components/ui/copy-button';

export default function AirtimeResultScreen() {
  const params = useLocalSearchParams<{
    status: string;
    message: string;
    provider: string;
    phone: string;
    plan?: string;
    smartcard?: string;
    packageName?: string;
    months?: string;
    meter?: string;
    meterType?: string;
    token?: string;
    units?: string;
    amount: string;
    date: string;
  }>();

  const reset = useVasStore((s) => s.reset);
  const isSuccess = params.status === 'success';

  const handleBackToDashboard = () => {
    reset();
    router.replace('/Dashboard');
  };

  return (
    <HeaderScreen>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pt-12">
        <View className="items-center mb-5">
          {isSuccess ? (
            <MaterialCommunityIcons
              name="check-decagram"
              size={72}
              color="#16A34A"
            />
          ) : (
            <View className="w-[72px] h-[72px] rounded-2xl bg-[#EF4444] items-center justify-center">
              <MaterialCommunityIcons name="close" size={40} color="#fff" />
            </View>
          )}
        </View>

        <Text
          className={`text-[22px] font-bold text-center mb-2 ${
            isSuccess ? 'text-[#1A1A1A]' : 'text-[#EF4444]'
          }`}
        >
          {isSuccess ? 'Successful!' : 'Transaction failed!'}
        </Text>
        <Text className="text-[13px] text-[#6B7280] text-center leading-5 mb-8">
          {params.message}
        </Text>

        {/* Prepaid electricity recharge token — the customer needs this to load
            their meter, so surface it prominently with a copy action. */}
        {isSuccess && params.token ? (
          <View className="bg-[#E8EEF7] rounded-[14px] p-4 mb-5">
            <Text className="text-[13px] text-[#6B7280] mb-1.5">Recharge Token</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-[#1A1A1A] flex-1 mr-3">
                {params.token}
              </Text>
              <CopyButton
                value={params.token}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                // Below the trigger is the "Units" line, a later sibling the
                // pill can't paint over.
                pillPlacement="above"
              >
                <MaterialCommunityIcons
                  name="content-copy"
                  size={18}
                  color="#032252"
                />
                <Text className="text-[13px] font-semibold text-[#032252]">Copy</Text>
              </CopyButton>
            </View>
            {params.units ? (
              <Text className="text-[13px] text-[#374151] mt-2">
                Units: <Text className="font-semibold">{params.units}</Text>
              </Text>
            ) : null}
          </View>
        ) : null}

        <TransactionSummaryCard
          provider={params.provider ?? ''}
          phone={params.phone || undefined}
          plan={params.plan || undefined}
          smartcard={params.smartcard || undefined}
          packageName={params.packageName || undefined}
          months={params.months || undefined}
          meter={params.meter || undefined}
          meterType={params.meterType || undefined}
          amount={params.amount ?? ''}
          date={params.date ?? ''}
        />
      </ScrollView>

      <View className="pb-4">
        {isSuccess ? (
          <TouchableOpacity
            className="bg-[#F9B700] rounded-full py-4 items-center"
            onPress={handleBackToDashboard}
            activeOpacity={0.85}
          >
            <Text className="text-[#032252] text-base font-semibold">
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-[#F9B700] rounded-full py-4 flex-row items-center justify-center gap-2"
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#032252" />
            <Text className="text-[#032252] text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </HeaderScreen>
  );
}
