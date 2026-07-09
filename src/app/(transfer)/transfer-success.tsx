import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';

import { SuccessCelebration } from '@/components/ui/success-celebration';
import { walletService } from '@/services/wallet.service';
import { useTransferStore } from '@/stores/transfer.store';
import { DetailRow } from '@/components/features/transaction/DetailRow';
import { buildReceiptHtml, shareFile } from '@/utils/receipt';
import {
  formatNairaDecimal,
  formatNairaWhole,
  formatTransactionDateTime,
} from '@/utils/format';

export default function TransferSuccessScreen() {
  const store = useTransferStore();
  const result = store.transferResult;
  const hasNavigatedAway = useRef(false);
  const { width: screenWidth } = useWindowDimensions();

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
      // Capture the off-screen receipt as a data-URI and wrap it in a PDF —
      // keeps the PDF pixel-identical to the receipt design (logo included).
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
    <SafeAreaView className="flex-1 bg-white">
      {/*
        Off-screen receipt — kept mounted purely as the capture source for
        Share Image / Download PDF. Rendered far off-screen with a fixed width
        and collapsable={false} so react-native-view-shot can snapshot it
        reliably on both iOS and Android.
      */}
      <View
        style={{ position: 'absolute', left: -9999, top: 0, width: screenWidth - 48 }}
        collapsable={false}
        pointerEvents="none"
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View className="bg-white px-5 py-6 border border-[#E5E7EB] rounded-[16px]">
            <View className="flex-row items-center justify-between">
              <Image
                source={require('../../../assets/images/welcome/NeatLogo.png')}
                className="w-16 h-12"
                resizeMode="contain"
              />
              <Text className="text-[15px] font-medium text-[#1A1A1A]">
                Transaction Receipt
              </Text>
            </View>

            <View className="border-b border-[#E5E7EB] my-4" />

            <Text className="text-[26px] font-bold text-[#472FF8] text-center mt-2">
              {formatNairaDecimal(result.amount)}
            </Text>
            <Text className="text-[13px] text-[#6B7280] text-center mt-1">
              Successful
            </Text>
            <Text className="text-[12px] text-[#9CA3AF] text-center mt-1">
              {formatTransactionDateTime(receiptDate.toISOString())}
            </Text>

            <View className="border-b border-[#E5E7EB] my-4" />

            {store.senderName ? (
              <DetailRow label="Sender" value={store.senderName} />
            ) : null}
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
        </ViewShot>
      </View>

      {/* Done */}
      <View className="px-6 pt-2 flex-row justify-end">
        <TouchableOpacity onPress={handleBack} hitSlop={8} activeOpacity={0.7}>
          <Text className="text-base font-semibold text-[#472FF8]">Done</Text>
        </TouchableOpacity>
      </View>

      {/* Celebration */}
      <View className="flex-1 px-6 items-center pt-4">
        <SuccessCelebration />

        <Text className="text-[15px] text-[#6B7280] text-center mt-4">
          Transfer successful
        </Text>
        <Text className="text-[28px] font-bold text-[#1A1A1A] text-center mt-1">
          {formatNairaWhole(result.amount)}
        </Text>

        <View className="bg-[#EEF0FF] border border-[#472FF8]/30 rounded-[14px] px-4 py-4 mt-6 w-full">
          <Text className="text-[13px] text-[#472FF8] text-center leading-5">
            The recipient account is expected to be credited within 5 minutes,
            subject to notification by the bank.
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row justify-around mt-10 w-full">
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
        </View>
      </View>
    </SafeAreaView>
  );
}
