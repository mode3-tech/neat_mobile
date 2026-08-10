import { useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useBulkTransferStore } from '@/stores/bulk-transfer.store';

interface ChoiceCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function ChoiceCard({ icon, title, subtitle, onPress }: ChoiceCardProps) {
  return (
    <TouchableOpacity
      className="bg-surface-input rounded-xl p-4 flex-row items-center mb-4"
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-ink">{title}</Text>
        <Text className="text-[12px] text-ink-soft mt-0.5">{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function BulkTransferScreen() {
  const reset = useBulkTransferStore((s) => s.reset);

  // Clear any leftover recipients from a previous abandoned flow so the user
  // always starts fresh when entering Send Bulk from the dashboard.
  useEffect(() => {
    reset();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <TouchableOpacity
          className="self-start border border-line rounded-[20px] px-6 py-1.5 mt-2 mb-8"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-ink-body">Back</Text>
        </TouchableOpacity>

        <Text className="text-[20px] font-medium text-ink mb-6">
          Bulk Payment
        </Text>

        <ChoiceCard
          icon="send"
          title="Add Manually"
          subtitle="Enter Recipient details one by one"
          onPress={() => router.push('/(transfer)/bulk-add-recipient')}
        />

        <ChoiceCard
          icon="file-excel-outline"
          title="Upload Excel File"
          subtitle="Import multiple recipients at once"
          onPress={() =>
            Alert.alert(
              'Coming soon',
              'Excel upload will be available shortly.',
            )
          }
        />

        <View className="bg-primary-surface rounded-xl p-4 border border-primary/30 mt-4">
          <Text className="text-[13px] text-primary text-center leading-5">
            Note: Bulk payments allow you to send money to multiple recipients
            at once. Transaction fees apply per recipient.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
