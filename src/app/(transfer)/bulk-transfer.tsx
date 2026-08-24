// ⚠️ PRE-REDESIGN — still on the old purple palette (#472FF8 / #EEF0FF).
// Skipped during the 2026-08 re-skin because nothing routes here: no screen
// navigates to bulk-transfer or bulk-add-recipient, only `bulk-transfer-pin`
// is registered in _layout.tsx. Re-skin this flow (bulk-transfer,
// bulk-add-recipient, bulk-transfer-review, bulk-transfer-success — ~19 hex
// literals) to the navy/yellow palette BEFORE wiring up an entry point, or a
// user will drop into old-design screens mid-flow.
import { useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useBulkTransferStore } from '@/stores/bulk-transfer.store';
import { BackButton } from '@/components/ui/back-button';

interface ChoiceCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function ChoiceCard({ icon, title, subtitle, onPress }: ChoiceCardProps) {
  return (
    <TouchableOpacity
      className="bg-[#F5F5F5] rounded-xl p-4 flex-row items-center mb-4"
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-xl bg-[#472FF8] items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-[#1A1A1A]">{title}</Text>
        <Text className="text-[12px] text-[#6B7280] mt-0.5">{subtitle}</Text>
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
        <View className="flex-row items-center gap-2 mt-4 mb-6">
          <BackButton className="" />
          <Text
            className="text-[20px] font-medium text-[#1A1A1A] leading-[24px]"
            style={{ includeFontPadding: false }}
          >
            Bulk Payment
          </Text>
        </View>

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

        <View className="bg-[#EEF0FF] rounded-xl p-4 border border-[#472FF8]/30 mt-4">
          <Text className="text-[13px] text-[#472FF8] text-center leading-5">
            Note: Bulk payments allow you to send money to multiple recipients
            at once. Transaction fees apply per recipient.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
