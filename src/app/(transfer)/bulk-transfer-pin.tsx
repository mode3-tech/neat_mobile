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
import { useBulkTransferStore } from '@/stores/bulk-transfer.store';
import { getErrorMessage } from '@/utils/error';

export default function BulkTransferPinScreen() {
  const { recipients, setResultMessage } = useBulkTransferStore();
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

  useEffect(() => {
    if (recipients.length === 0) router.back();
  }, []);

  const canConfirm = pin.length === PIN_LENGTH;

  const submitBulk = async (transactionPin: string) => {
    setSubmitting(true);
    try {
      const response = await walletService.transferBulk({
        recipient_info: recipients.map((r) => ({
          amount: r.amount,
          sort_code: r.sort_code,
          narration: r.narration || 'Bulk payment',
          account_number: r.account_number,
          account_name: r.account_name,
          metadata: {},
        })),
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      setResultMessage(
        response.message || 'Your bulk transfer has been processed successfully.',
      );
      router.replace('/(transfer)/bulk-transfer-success');
    } catch (err: unknown) {
      toast.error('Bulk transfer failed', { description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!canConfirm || submitting) return;
    submitBulk(pin);
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
    submitBulk(storedPin);
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

        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-[22px] font-bold text-[#1A1A1A] mb-2">
            Enter PIN
          </Text>
          <Text className="text-[13px] text-[#6B7280] mb-8">
            Enter your 4-digit PIN to confirm bulk transfer
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
        </KeyboardAwareScrollView>

        <View className="pb-4">
          <View className="flex-row items-center gap-3">
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
                  name={
                    biometryType === 'FACE'
                      ? 'face-recognition'
                      : 'fingerprint'
                  }
                  size={28}
                  color="#472FF8"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
