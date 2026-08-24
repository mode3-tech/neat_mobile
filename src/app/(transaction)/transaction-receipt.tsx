import { useEffect, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';

import { STATUS_COLORS } from '@/components/features/transaction/TransactionRow';
import { ReceiptCard } from '@/components/features/transaction/ReceiptCard';
import { buildAmountRows, buildReceiptHtml, shareFile } from '@/utils/receipt';
import {
  formatNairaDecimal,
  formatTransactionDateTime,
  titleCase,
} from '@/utils/format';
import { useAccountSummary } from '@/hooks/use-account-summary';
import { useAuthStore } from '@/stores/auth.store';
import type { Transaction } from '@/types/transaction.types';

export default function TransactionReceiptScreen() {
  const { tx } = useLocalSearchParams<{ tx: string }>();
  const viewShotRef = useRef<ViewShot>(null);
  const { data: summary } = useAccountSummary();
  const user = useAuthStore((s) => s.user);

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

  const statusLabel = titleCase(transaction.status);

  // For a credit the logged-in user is the recipient; the counterparty is the
  // sender. For a debit the counterparty is the recipient (unchanged).
  const isCredit = transaction.type === 'credit';
  const userName =
    summary?.full_name ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const cp = transaction.counterparty;

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

  const receiptRows: { label: string; value: string; valueColor?: string }[] = [
    ...(recipientRow ? [recipientRow] : []),
    ...(senderRow ? [senderRow] : []),
    ...buildAmountRows({
      amount: transaction.amount,
      charges: transaction.charges,
      vat: transaction.vat,
      isCredit,
    }),
    { label: 'Transaction No.', value: transaction.reference ?? transaction.id },
    { label: 'Transaction Type', value: titleCase(transaction.type) },
    {
      label: 'Transaction Date',
      value: formatTransactionDateTime(transaction.date),
    },
    ...(transaction.narration
      ? [{ label: 'Narration', value: transaction.narration }]
      : []),
    {
      label: 'Transaction Status',
      value: statusLabel,
      valueColor: STATUS_COLORS[transaction.status] ?? '#6B7280',
    },
  ];

  const handleShareAsImage = async () => {
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      if (uri) await shareFile(uri);
    } catch {
      // user cancelled or capture failed
    }
  };

  const handleShareAsPdf = async () => {
    try {
      // Capture the receipt card as a data-URI and wrap it in a PDF — keeps the
      // PDF pixel-identical to the on-screen receipt (logo included).
      const dataUri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'data-uri',
      });
      const { uri } = await Print.printToFileAsync({
        html: buildReceiptHtml(dataUri),
      });
      await shareFile(uri);
    } catch {
      // user cancelled or capture failed
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F3F8]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="mr-3"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="#032252" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-[#032252]">
          Share Receipt
        </Text>
      </View>

      {/* Receipt */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <ReceiptCard
            amount={formatNairaDecimal(transaction.amount)}
            statusLabel={statusLabel}
            date={formatTransactionDateTime(transaction.date)}
            rows={receiptRows}
          />
        </ViewShot>
      </ScrollView>

      {/* Share options */}
      <View className="flex-row border-t border-[#EEF1F6] bg-white">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-5"
          onPress={handleShareAsImage}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="image-outline" size={20} color="#032252" />
          <Text className="text-[15px] font-semibold text-[#032252] ml-2">
            Share as image
          </Text>
        </TouchableOpacity>

        <View className="w-px my-4 bg-[#EEF1F6]" />

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-5"
          onPress={handleShareAsPdf}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={20} color="#032252" />
          <Text className="text-[15px] font-semibold text-[#032252] ml-2">
            Share as PDF
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
