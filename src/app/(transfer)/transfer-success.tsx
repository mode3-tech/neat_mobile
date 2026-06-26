import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';

import { walletService } from '@/services/wallet.service';
import { useTransferStore } from '@/stores/transfer.store';
import { buildReceiptHtml, shareFile } from '@/utils/receipt';
import { formatTransactionDateTime } from '@/utils/format';

function formatAmount(amount: number): string {
  return (
    'NGN ' +
    new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  );
}

function ReceiptRow({
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
      className={`flex-row justify-between items-start gap-4 py-[14px] ${
        !isLast ? 'border-b border-[#F3F4F6]' : ''
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

export default function TransferSuccessScreen() {
  const store = useTransferStore();
  const result = store.transferResult;
  const hasNavigatedAway = useRef(false);

  const viewShotRef = useRef<ViewShot>(null);
  const [beneficiaryAdded, setBeneficiaryAdded] = useState(false);
  const [addingBeneficiary, setAddingBeneficiary] = useState(false);
  // Capture the receipt time once so it doesn't drift across re-renders.
  const [receiptDate] = useState(() => new Date());

  const handleBack = () => {
    if (hasNavigatedAway.current) return;
    hasNavigatedAway.current = true;
    store.reset();
    router.replace('/Dashboard');
  };

  // Guard: redirect if accessed without transfer result (direct navigation)
  useEffect(() => {
    if (!result) {
      handleBack();
    }
  }, []);

  if (!result) return null;

  const detailRows: { label: string; value: string; valueColor?: string }[] = [
    { label: 'Name', value: store.accountName },
    { label: 'Account No.', value: store.accountNumber },
    { label: 'Bank Name', value: store.bankName },
    { label: 'Session ID', value: result.sessionId },
    { label: 'Transaction ID', value: result.transactionReference },
    { label: 'Transaction Status', value: 'Successful', valueColor: '#16A34A' },
    ...(store.narration
      ? [{ label: 'Remark', value: store.narration }]
      : []),
  ];

  const handleShareAsImage = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) await shareFile(uri);
    } catch {
      // user cancelled or error
    }
  };

  const handleShareAsPdf = async () => {
    try {
      // Capture the on-screen receipt as a data-URI and wrap it in a PDF —
      // keeps the PDF pixel-identical to the screen (logo included).
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
      // user cancelled or error
    }
  };

  const handleAddBeneficiary = async () => {
    if (beneficiaryAdded || addingBeneficiary) return;
    setAddingBeneficiary(true);
    try {
      await walletService.addBeneficiary({
        bank_code: store.bankCode,
        account_number: store.accountNumber,
        account_name: store.accountName,
        // wallet_id: 'WLT-001',
      });
      setBeneficiaryAdded(true);
    } catch {
      // silent — user can retry
    } finally {
      setAddingBeneficiary(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 pt-8"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Receipt card (captured for Share Image / Download PDF) */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View className="bg-white px-5 py-6 border border-[#E5E7EB] rounded-[16px]">
            {/* Brand logo */}
            <Image
              source={require('../../../assets/images/welcome/NeatLogo.png')}
              className="w-16 h-12 self-center"
              resizeMode="contain"
            />

            <View className="border-b border-[#E5E7EB] my-4" />

            {/* Amount + status + timestamp */}
            <Text className="text-base font-bold text-[#1A1A1A] text-center">
              Transaction Receipt
            </Text>
            <Text className="text-[26px] font-bold text-[#472FF8] text-center mt-2">
              {formatAmount(result.amount)}
            </Text>
            <Text className="text-[13px] text-[#6B7280] text-center mt-1">
              Successful
            </Text>
            <Text className="text-[12px] text-[#9CA3AF] text-center mt-1">
              {formatTransactionDateTime(receiptDate.toISOString())}
            </Text>

            <View className="border-b border-[#E5E7EB] my-4" />

            {/* Sender */}
            {store.senderName ? (
              <ReceiptRow label="Sender" value={store.senderName} isLast />
            ) : null}

            {/* Beneficiary details */}
            <Text className="text-sm font-semibold text-[#472FF8] mt-4 mb-1">
              Beneficiary details
            </Text>
            {detailRows.map((row, i) => (
              <ReceiptRow
                key={row.label}
                label={row.label}
                value={row.value}
                valueColor={row.valueColor}
                isLast={i === detailRows.length - 1}
              />
            ))}
          </View>
        </ViewShot>

        {/* More menu */}
        <Text className="text-base font-semibold text-[#1A1A1A] mb-4 mt-8">
          More menu
        </Text>
        <View className="flex-row justify-around mb-8">
          {/* Share as Image */}
          <TouchableOpacity
            className="items-center w-20"
            onPress={handleShareAsImage}
          >
            <View className="w-14 h-14 rounded-2xl bg-[#EEF0FF] items-center justify-center mb-2">
              <MaterialCommunityIcons
                name="image-outline"
                size={22}
                color="#472FF8"
              />
            </View>
            <Text className="text-xs text-[#374151] text-center">
              Share{'\n'}Image
            </Text>
          </TouchableOpacity>

          {/* Download PDF */}
          <TouchableOpacity
            className="items-center w-20"
            onPress={handleShareAsPdf}
          >
            <View className="w-14 h-14 rounded-2xl bg-[#EEF0FF] items-center justify-center mb-2">
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={22}
                color="#472FF8"
              />
            </View>
            <Text className="text-xs text-[#374151] text-center">
              Download{'\n'}PDF
            </Text>
          </TouchableOpacity>

          {/* Add to Beneficiary */}
          <TouchableOpacity
            className="items-center w-20"
            onPress={handleAddBeneficiary}
            disabled={beneficiaryAdded}
          >
            <View className="w-14 h-14 rounded-2xl bg-[#EEF0FF] items-center justify-center mb-2">
              {addingBeneficiary ? (
                <ActivityIndicator size="small" color="#472FF8" />
              ) : (
                <MaterialCommunityIcons
                  name={beneficiaryAdded ? 'check-circle' : 'account-plus-outline'}
                  size={22}
                  color="#472FF8"
                />
              )}
            </View>
            <Text className="text-xs text-[#374151] text-center">
              {beneficiaryAdded ? 'Added' : `Add to${'\n'}Beneficiary`}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1" />
      </ScrollView>

      {/* Back to Dashboard */}
      <View className="pb-4">
        <TouchableOpacity
          className="bg-[#472FF8] rounded-full py-4 items-center"
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
