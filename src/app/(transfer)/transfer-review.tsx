import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { PIN_LENGTH } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { walletService } from '@/services/wallet.service';
import { useTransferStore } from '@/stores/transfer.store';
import { getErrorMessage } from '@/utils/error';

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
      className={`flex-row justify-between items-center py-[14px] ${
        !isLast ? 'border-b border-[#E5E7EB]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280]">{label}</Text>
      <Text
        className="text-sm font-semibold"
        style={{ color: valueColor ?? '#1A1A1A' }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function TransferReviewScreen() {
  const store = useTransferStore();
  const {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  } = useBiometricAuth();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Guard: redirect back if store is empty (direct navigation)
  useEffect(() => {
    if (!store.accountNumber) {
      router.back();
    }
  }, []);

  const parsedAmount = parseInt(store.amount, 10) || 0;

  const canConfirm = pin.length === PIN_LENGTH;

  const submitTransfer = async (transactionPin: string) => {
    setSubmitting(true);
    try {
      const response = await walletService.transfer({
        amount: parsedAmount,
        sort_code: store.bankCode,
        account_number: store.accountNumber,
        narration: store.narration,
        account_name: store.accountName,
        metadata: {},
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      store.setTransferResult(response.transfer);
      router.push('/(transfer)/transfer-success');
    } catch (err: unknown) {
      toast.error('Transfer failed', { description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!canConfirm || submitting) return;
    submitTransfer(pin);
  };

  const handleBiometric = async () => {
    if (authenticating || submitting) return;
    const storedPin = await authenticateWithBiometric();
    if (!storedPin) {
      toast.error('Authentication failed', {
        description: 'Biometric authentication failed. Please use your PIN.',
      });
      return;
    }
    submitTransfer(storedPin);
  };

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
      ? [{ label: 'Bank Name', value: store.bankName, valueColor: '#472FF8' }]
      : []),
    { label: 'Commission', value: formatCurrency(10.75) },
    // { label: 'Total Debit', value: formatCurrency(parsedAmount), valueColor: '#472FF8' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">
          Review
        </Text>

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

        {/* PIN section */}
        <Text className="text-[13px] font-semibold text-[#374151] mb-3">
          Enter Transaction PIN
        </Text>
        <View className="mb-6">
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
            <TextInput
              className="flex-1 text-[15px] text-[#1A1A1A] p-0 text-center tracking-[8px]"
              value={pin}
              onChangeText={(t) =>
                setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH))
              }
              placeholder="••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPin}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
            />
            <TouchableOpacity onPress={() => setShowPin((v) => !v)}>
              <MaterialCommunityIcons
                name={showPin ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm + Fingerprint */}
        <View className="flex-row items-center gap-3 mb-8">
          <TouchableOpacity
            className={`flex-1 rounded-full py-4 items-center ${
              canConfirm ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'
            }`}
            onPress={handleConfirm}
            disabled={!canConfirm || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  canConfirm ? 'text-white' : 'text-[#9CA3AF]'
                }`}
              >
                Confirm
              </Text>
            )}
          </TouchableOpacity>

          {isBiometricReady && (
            <TouchableOpacity
              className="w-14 h-14 rounded-full border border-[#E5E7EB] items-center justify-center"
              activeOpacity={0.7}
              onPress={handleBiometric}
              disabled={authenticating || submitting}
            >
              <MaterialCommunityIcons
                name={biometryType === 'FACE' ? 'face-recognition' : 'fingerprint'}
                size={28}
                color="#472FF8"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Cancel */}
        <TouchableOpacity
          className="rounded-full py-4 items-center border-[1.5px] border-[#472FF8] mb-6"
          onPress={handleCancel}
          activeOpacity={0.85}
        >
          <Text className="text-base font-semibold text-[#472FF8]">Cancel</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
