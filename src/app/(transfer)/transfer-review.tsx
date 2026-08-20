import { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { HeaderScreen } from '@/components/ui/header-screen';
import { router } from 'expo-router';

import { TRANSFER_FEE } from '@/constants';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTransferStore } from '@/stores/transfer.store';
import { BackButton } from '@/components/ui/back-button';

function formatCurrency(amount: number): string {
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
  valueColor,
  isLast,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-start py-[14px] gap-4 ${
        !isLast ? 'border-b border-[#E5E7EB]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280] shrink-0">{label}</Text>
      <Text
        className="text-sm font-semibold flex-1 text-right"
        style={{ color: valueColor ?? '#1A1A1A' }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function TransferReviewScreen() {
  const store = useTransferStore();
  const { isOffline } = useNetworkStatus();

  // Guard: redirect back if store is empty (direct navigation)
  useEffect(() => {
    if (!store.accountNumber) {
      router.back();
    }
  }, []);

  const parsedAmount = parseInt(store.amount, 10) || 0;

  const handleCancel = () => {
    store.reset();
    router.replace('/Dashboard');
  };

  const summaryRows = [
    { label: 'Sender', value: store.senderName },
    { label: 'Amount', value: formatCurrency(parsedAmount) },
    { label: 'Recipient Account', value: store.accountNumber },
    { label: 'Recipient Name', value: store.accountName },
    ...(store.transferType === 'other_bank'
      ? [{ label: 'Bank Name', value: store.bankName, valueColor: '#032252' }]
      : []),
    { label: 'Commission', value: formatCurrency(TRANSFER_FEE) },
    // { label: 'Total Debit', value: formatCurrency(parsedAmount), valueColor: '#032252' },
  ];

  return (
    <HeaderScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-6">
        <BackButton className="" />
        <Text
          className="text-[22px] font-bold text-[#1A1A1A] leading-[26px]"
          style={{ includeFontPadding: false }}
        >
          Review
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Summary card */}
        <View className="bg-[#F6F5F8] rounded-[14px] px-4 mb-10">
          {summaryRows.map((row, i) => (
            <SummaryRow
              key={row.label}
              label={row.label}
              value={row.value}
              valueColor={row.valueColor}
              isLast={i === summaryRows.length - 1}
            />
          ))}
        </View>

        {/* Proceed to the PIN keypad. Offline is stopped here rather than on
            the keypad, which has no button to grey out. */}
        <TouchableOpacity
          className={`rounded-full py-4 items-center mb-4 ${
            isOffline ? 'bg-[#E5E7EB]' : 'bg-[#F9B700]'
          }`}
          onPress={() => router.push('/(transfer)/transfer-pin')}
          disabled={isOffline}
          activeOpacity={0.85}
        >
          <Text
            className={`text-base font-semibold ${
              isOffline ? 'text-[#9CA3AF]' : 'text-[#032252]'
            }`}
          >
            Proceed
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          className="rounded-full py-4 items-center border-[1.5px] border-[#032252] mb-6"
          onPress={handleCancel}
          activeOpacity={0.85}
        >
          <Text className="text-base font-semibold text-[#032252]">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </HeaderScreen>
  );
}
