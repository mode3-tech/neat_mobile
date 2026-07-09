import { useEffect } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  getTransactionIcon,
  STATUS_COLORS,
} from '@/components/features/transaction/TransactionRow';
import { DetailRow } from '@/components/features/transaction/DetailRow';
import {
  formatNairaWhole,
  formatTransactionDateTime,
  titleCase,
} from '@/utils/format';
import type { Transaction } from '@/types/transaction.types';

export default function TransactionDetailsScreen() {
  const { tx } = useLocalSearchParams<{ tx: string }>();

  let transaction: Transaction | null = null;
  try {
    transaction = tx ? (JSON.parse(tx) as Transaction) : null;
  } catch {
    transaction = null;
  }

  // Guard: bail out if the screen was reached without a valid transaction.
  // The navigation runs in an effect — calling router.back() during render is a
  // side-effect that warns and can strand the user on a blank screen.
  useEffect(() => {
    if (!transaction) router.back();
  }, [transaction]);

  if (!transaction) {
    return null;
  }

  const { icon, bgColor, iconColor } = getTransactionIcon(
    transaction.description,
  );
  const isCredit = transaction.type === 'credit';
  const prefix = isCredit ? '+' : '-';
  const statusColor = STATUS_COLORS[transaction.status] ?? '#6B7280';
  const statusLabel = titleCase(transaction.status);

  const detailRows: { label: string; value: string; valueColor?: string }[] = [
    ...(transaction.counterparty
      ? [
          {
            label: 'Recipient Details',
            value: `${transaction.counterparty.name}\n${transaction.counterparty.account_number}`,
          },
        ]
      : []),
    { label: 'Transaction No.', value: transaction.reference ?? transaction.id },
    { label: 'Transaction Type', value: titleCase(transaction.type) },
    {
      label: 'Transaction Date',
      value: formatTransactionDateTime(transaction.date),
    },
    ...(transaction.narration
      ? [{ label: 'Narration', value: transaction.narration }]
      : []),
    { label: 'Status', value: statusLabel, valueColor: statusColor },
  ];

  const handleShareReceipt = () => {
    router.push({
      pathname: '/(transaction)/transaction-receipt',
      params: { tx },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6">
        <TouchableOpacity
          className="self-start border border-[#E5E7EB] rounded-[20px] px-6 py-1.5 mt-2 mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>
        <Text className="text-[20px] font-medium text-[#1A1A1A]">
          Transaction Details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Summary card */}
        <View className="mx-6 mt-6 items-center rounded-[16px] border border-[#F3F4F6] bg-white px-5 py-6">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
          </View>
          <Text className="text-[15px] font-semibold text-[#1A1A1A] text-center mt-4">
            {transaction.description}
          </Text>
          <Text
            className={`text-[28px] font-bold mt-2 ${
              isCredit ? 'text-[#472FF8]' : 'text-[#1A1A1A]'
            }`}
          >
            {prefix}
            {formatNairaWhole(transaction.amount)}
          </Text>
          <Text
            className="text-sm font-medium mt-1"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </Text>
        </View>

        {/* Transaction Details section */}
        <View className="mx-6 mt-4 rounded-[16px] border border-[#F3F4F6] bg-white px-5 py-2">
          <Text className="text-base font-semibold text-[#1A1A1A] pt-3 pb-1">
            Transaction Details
          </Text>
          {detailRows.map((row, i) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              valueColor={row.valueColor}
              isLast={i === detailRows.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* More Actions */}
      <View className="px-6 pt-4 pb-6 border-t border-[#F3F4F6]">
        <TouchableOpacity
          className="bg-[#472FF8] rounded-[50px] py-4 items-center flex-row justify-center"
          onPress={handleShareReceipt}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="share-variant" size={18} color="white" />
          <Text className="text-white text-base font-semibold ml-2">
            Share Receipt
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
