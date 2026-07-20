import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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
import { useAccountSummary } from '@/hooks/use-account-summary';
import { useAuthStore } from '@/stores/auth.store';
import { transactionService } from '@/services/transaction.service';
import { QUERY_KEYS } from '@/constants';
import type { Transaction } from '@/types/transaction.types';

export default function TransactionDetailsScreen() {
  // Two ways in. List taps pass `tx` — the row already holds every field, so
  // there is nothing to fetch. Notification deep links only carry an id, so
  // that path fetches. `tx` wins when both are somehow present.
  const { tx, id } = useLocalSearchParams<{ tx?: string; id?: string }>();
  const { data: summary } = useAccountSummary();
  const user = useAuthStore((s) => s.user);

  const parsedTx = useMemo<Transaction | null>(() => {
    try {
      return tx ? (JSON.parse(tx) as Transaction) : null;
    } catch {
      return null;
    }
  }, [tx]);

  const {
    data: fetched,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTION_DETAILS, id],
    queryFn: () => transactionService.getById(id!),
    enabled: !!id && !parsedTx,
  });

  const transaction = parsedTx ?? fetched ?? null;
  const hasInput = !!parsedTx || !!id;

  // Guard: bail out only if the screen was reached with neither a serialized
  // transaction nor an id — NOT on `!transaction`, which is briefly true while
  // the id fetch is in flight and would bounce the user off their own deep link.
  // The navigation runs in an effect — calling router.back() during render is a
  // side-effect that warns and can strand the user on a blank screen.
  useEffect(() => {
    if (!hasInput) router.back();
  }, [hasInput]);

  const header = (
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
  );

  if (!hasInput) {
    return null;
  }

  // Only the id path can be transaction-less here: `tx` parses synchronously, so
  // the list path always falls through to the render below. Anything that isn't
  // an in-flight fetch — a real error, or a 200 carrying no transaction — is a
  // failure the user can retry out of, never a spinner with no escape.
  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {header}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#472FF8" />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-[15px] text-[#6B7280] text-center">
              We couldn&apos;t load this transaction.
            </Text>
            <TouchableOpacity
              className="mt-4 bg-[#472FF8] rounded-[50px] px-6 py-3"
              onPress={() => refetch()}
              activeOpacity={0.85}
            >
              <Text className="text-white text-sm font-semibold">Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const { icon, bgColor, iconColor } = getTransactionIcon(
    transaction.description,
  );
  const isCredit = transaction.type === 'credit';
  const prefix = isCredit ? '+' : '-';
  const statusColor = STATUS_COLORS[transaction.status] ?? '#6B7280';
  const statusLabel = titleCase(transaction.status);

  // For a credit the logged-in user is the recipient; the counterparty is the
  // sender. For a debit the counterparty is the recipient (unchanged).
  const userName =
    summary?.full_name ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const cp = transaction.counterparty;
  const txNo = transaction.reference ?? transaction.id;

  const recipientRow = isCredit
    ? { label: 'Recipient Details', value: userName }
    : cp
      ? {
          label: 'Recipient Details',
          value: `${cp.name}\n${cp.account_number}`,
        }
      : null;
  const senderRow =
    isCredit && cp
      ? {
          label: 'Sender Details',
          value: `${cp.name}\n${cp.account_number}\n${cp.bank}`,
        }
      : null;

  const detailRows: {
    label: string;
    value: string;
    valueColor?: string;
    copyValue?: string;
  }[] = [
    ...(recipientRow ? [recipientRow] : []),
    ...(senderRow ? [senderRow] : []),
    { label: 'Transaction No.', value: txNo, copyValue: txNo },
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
      params: { tx: JSON.stringify(transaction) },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {header}

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
              copyValue={row.copyValue}
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
