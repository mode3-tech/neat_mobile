import { useEffect, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useBulkTransferStore } from '@/stores/bulk-transfer.store';

const FEE_PER_RECIPIENT = 10;

function formatNaira(amount: number): string {
  return (
    '₦' +
    new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  );
}

function SummaryRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center py-[14px] ${
        !isLast ? 'border-b border-[#E5E7EB]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280]">{label}</Text>
      <Text className="text-sm font-semibold text-[#1A1A1A]">{value}</Text>
    </View>
  );
}

export default function BulkTransferReviewScreen() {
  const { recipients, reset } = useBulkTransferStore();

  useEffect(() => {
    if (recipients.length === 0) router.back();
  }, []);

  const totalAmount = useMemo(
    () => recipients.reduce((sum, r) => sum + r.amount, 0),
    [recipients],
  );

  const totalFees = recipients.length * FEE_PER_RECIPIENT;
  const grandTotal = totalAmount + totalFees;

  const handleCancel = () => {
    reset();
    router.replace('/Dashboard');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <TouchableOpacity
          className="self-start border border-[#E5E7EB] rounded-[20px] px-6 py-1.5 mt-2 mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>

        <Text className="text-[20px] font-medium text-[#1A1A1A] mb-6">
          Review Payment
        </Text>

        <View className="bg-[#EEF0FF] border border-[#472FF8]/30 rounded-[14px] px-4 mb-6">
          <SummaryRow label="Total Amount" value={formatNaira(totalAmount)} />
          <SummaryRow
            label="No. of recipient"
            value={String(recipients.length).padStart(2, '0')}
          />
          <SummaryRow
            label="Transaction fees"
            value={formatNaira(totalFees)}
            isLast
          />
        </View>

        <Text className="text-base font-semibold text-[#1A1A1A] mb-3">
          Payment Breakdown
        </Text>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          {recipients.map((r, i) => (
            <View
              key={r.id}
              className="flex-row items-start py-4 border-b border-[#F3F4F6]"
            >
              <View className="w-8 h-8 rounded-full bg-[#F59E0B] items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-[13px] font-bold">
                  {i + 1}
                </Text>
              </View>
              <View className="flex-1 pr-2">
                <Text
                  className="text-[14px] font-bold text-[#1A1A1A]"
                  numberOfLines={1}
                >
                  {r.account_name}
                </Text>
                <Text
                  className="text-[12px] text-[#6B7280] mt-0.5"
                  numberOfLines={1}
                >
                  {r.account_number}
                </Text>
                <Text
                  className="text-[12px] text-[#472FF8] mt-0.5"
                  numberOfLines={2}
                >
                  {r.bank_name}
                </Text>
              </View>
              <Text className="text-[14px] font-bold text-[#16A34A]">
                {formatNaira(r.amount)}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="pb-4 pt-4">
          <TouchableOpacity
            className="rounded-full py-4 items-center bg-[#472FF8] mb-3"
            onPress={() => router.push('/(transfer)/bulk-transfer-pin')}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">
              Send {formatNaira(grandTotal)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-full py-4 items-center border-[1.5px] border-[#472FF8]"
            onPress={handleCancel}
            activeOpacity={0.85}
          >
            <Text className="text-[#472FF8] text-base font-semibold">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
