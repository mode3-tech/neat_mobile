import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';

import { walletService } from '@/services/wallet.service';
import { useTransferStore } from '@/stores/transfer.store';
import { buildReceiptHtml, shareFile } from '@/utils/receipt';

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
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center py-[14px] ${
        !isLast ? 'border-b border-[#F3F4F6]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280]">{label}</Text>
      <Text className="text-sm font-semibold text-[#1A1A1A]">{value}</Text>
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

  const rows = [
    { label: 'Sender', value: store.senderPhone },
    { label: 'Amount', value: formatCurrency(result.amount) },
    { label: 'Recipient Account', value: store.accountNumber },
    { label: 'Recipient Name', value: store.accountName },
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
      const html = buildReceiptHtml({
        sender: store.senderPhone,
        amount: formatCurrency(result.amount),
        recipientAccount: store.accountNumber,
        recipientName: store.accountName,
        bankName: store.bankName,
        reference: result.reference,
        date: new Date().toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        description: result.description,
      });
      const { uri } = await Print.printToFileAsync({ html });
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
        className="flex-1 pt-10"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View className="bg-white px-6 pt-4 pb-6">
            {/* Success icon */}
            <View className="items-center mb-5">
              <View className="w-16 h-16 rounded-full bg-[#16A34A] items-center justify-center">
                <MaterialCommunityIcons name="check" size={32} color="#fff" />
              </View>
            </View>

            <Text className="text-[22px] font-bold text-[#1A1A1A] text-center mb-2">
              Successful!
            </Text>
            <Text className="text-[13px] text-[#6B7280] text-center leading-5 mb-7">
              {result.description}
            </Text>

            {/* Summary */}
            <View className="border border-[#E5E7EB] rounded-[14px] px-4">
              {rows.map((row, i) => (
                <SummaryRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={i === rows.length - 1}
                />
              ))}
            </View>
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

          {/* Add 1-tap payment */}
          <TouchableOpacity className="items-center w-20">
            <View className="w-14 h-14 rounded-2xl bg-[#EEF0FF] items-center justify-center mb-2">
              <MaterialCommunityIcons
                name="lightning-bolt-outline"
                size={22}
                color="#472FF8"
              />
            </View>
            <Text className="text-xs text-[#374151] text-center">
              Add 1-tap{'\n'}payment
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
