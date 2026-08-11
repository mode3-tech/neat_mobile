import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import { useVasStore } from '@/stores/vas.store';
import TransactionSummaryCard from '@/components/features/vas/TransactionSummaryCard';
import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

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

  const copyToken = async () => {
    if (!params.token) return;
    await Clipboard.setStringAsync(params.token);
    toast.success('Token copied');
  };

  const handleBackToDashboard = () => {
    reset();
    router.replace('/Dashboard');
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pt-12">
        <View className="items-center mb-5">
          {isSuccess ? (
            <Icon
              name="verified"
              size={72}
              color={colors.success}
            />
          ) : (
            <View className="w-[72px] h-[72px] rounded-2xl bg-danger items-center justify-center">
              <Icon name="close" size={40} color={colors.inkInverse} />
            </View>
          )}
        </View>

        <Text
          className={`text-[22px] font-bold text-center mb-2 ${
            isSuccess ? 'text-ink' : 'text-danger'
          }`}
        >
          {isSuccess ? 'Successful!' : 'Transaction failed!'}
        </Text>
        <Text className="text-[13px] text-ink-soft text-center leading-5 mb-8">
          {params.message}
        </Text>

        {/* Prepaid electricity recharge token — the customer needs this to load
            their meter, so surface it prominently with a copy action. */}
        {isSuccess && params.token ? (
          <View className="bg-primary-surface rounded-[14px] p-4 mb-5">
            <Text className="text-[13px] text-ink-soft mb-1.5">Recharge Token</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-ink flex-1 mr-3">
                {params.token}
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                onPress={copyToken}
              >
                <Icon
                  name="copy"
                  size={18}
                  color={colors.primary}
                />
                <Text className="text-[13px] font-semibold text-primary">Copy</Text>
              </TouchableOpacity>
            </View>
            {params.units ? (
              <Text className="text-[13px] text-ink-body mt-2">
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
            className="bg-primary rounded-full py-4 items-center"
            onPress={handleBackToDashboard}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-primary rounded-full py-4 flex-row items-center justify-center gap-2"
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Icon name="refresh" size={18} color={colors.inkInverse} />
            <Text className="text-white text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
