import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useVasStore } from '@/stores/vas.store';
import TransactionSummaryCard from '@/components/features/vas/TransactionSummaryCard';

export default function AirtimeResultScreen() {
  const params = useLocalSearchParams<{
    status: string;
    message: string;
    provider: string;
    phone: string;
    plan?: string;
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
    <SafeAreaView className="flex-1 bg-white px-6">
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

        <TransactionSummaryCard
          provider={params.provider ?? ''}
          phone={params.phone ?? ''}
          plan={params.plan || undefined}
          amount={params.amount ?? ''}
          date={params.date ?? ''}
        />
      </ScrollView>

      <View className="pb-4">
        {isSuccess ? (
          <TouchableOpacity
            className="bg-[#472FF8] rounded-full py-4 items-center"
            onPress={handleBackToDashboard}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-[#472FF8] rounded-full py-4 flex-row items-center justify-center gap-2"
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            <Text className="text-white text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
