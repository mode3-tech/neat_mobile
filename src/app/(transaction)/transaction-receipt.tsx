import { useEffect, useRef } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';

import { STATUS_COLORS } from '@/components/features/transaction/TransactionRow';
import { DetailRow } from '@/components/features/transaction/DetailRow';
import { buildReceiptHtml, shareFile } from '@/utils/receipt';
import {
  formatNairaDecimal,
  formatTransactionDateTime,
  titleCase,
} from '@/utils/format';
import { useAccountSummary } from '@/hooks/use-account-summary';
import { useAuthStore } from '@/stores/auth.store';
import type { Transaction } from '@/types/transaction.types';
import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

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
      valueColor: STATUS_COLORS[transaction.status] ?? colors.inkSoft,
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
    <SafeAreaView className="flex-1 bg-surface-input">
      {/* Header */}
      <View className="flex-row items-center px-6 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="mr-3"
        >
          <Icon name="back" size={26} color={colors.ink} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-ink">
          Share Receipt
        </Text>
      </View>

      {/* Receipt */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View className="bg-white rounded-[16px] px-5 py-6">
            {/* Logo (left) + tag (right) */}
            <View className="flex-row items-center justify-between">
              <Image
                source={require('../../../assets/images/welcome/NeatLogo.png')}
                className="w-16 h-12"
                resizeMode="contain"
              />
              <Text className="text-[15px] font-medium text-ink">
                Transaction Receipt
              </Text>
            </View>

            <View className="border-b border-line my-4" />

            <Text className="text-[26px] font-bold text-primary text-center mt-2">
              {formatNairaDecimal(transaction.amount)}
            </Text>
            <Text className="text-[13px] text-ink-soft text-center mt-1">
              {statusLabel}
            </Text>
            <Text className="text-[12px] text-ink-muted text-center mt-1">
              {formatTransactionDateTime(transaction.date)}
            </Text>

            <View className="border-b border-line my-4" />

            {receiptRows.map((row, i) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                valueColor={row.valueColor}
                isLast={i === receiptRows.length - 1}
              />
            ))}
          </View>
        </ViewShot>
      </ScrollView>

      {/* Share options */}
      <View className="flex-row border-t border-line bg-white">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-5"
          onPress={handleShareAsImage}
          activeOpacity={0.7}
        >
          <Icon name="image" size={20} color={colors.primary} />
          <Text className="text-[15px] font-semibold text-primary ml-2">
            Share as image
          </Text>
        </TouchableOpacity>

        <View className="w-px my-4 bg-surface-disabled" />

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-5"
          onPress={handleShareAsPdf}
          activeOpacity={0.7}
        >
          <Icon name="pdf" size={20} color={colors.primary} />
          <Text className="text-[15px] font-semibold text-primary ml-2">
            Share as PDF
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
