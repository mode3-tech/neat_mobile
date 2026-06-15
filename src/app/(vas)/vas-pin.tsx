import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';

import { ForgotPinLink } from '@/components/ui/forgot-pin-link';
import { PIN_LENGTH } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { getErrorMessage } from '@/utils/error';

export default function VasPinScreen() {
  const params = useLocalSearchParams<{
    provider: string;
    phone: string;
    plan?: string;
    amount: string;
    date: string;
  }>();

  const categoryName = useVasStore((s) => s.categoryName);
  const product = useVasStore((s) => s.product);
  const phoneNumber = useVasStore((s) => s.phoneNumber);
  const amount = useVasStore((s) => s.amount);

  const isData = categoryName === 'DATA';

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

  const canConfirm = pin.length === PIN_LENGTH;

  const goToResult = (status: 'success' | 'failed', message: string) => {
    router.push({
      pathname: '/(vas)/airtime-result',
      params: {
        status,
        message,
        provider: params.provider ?? '',
        phone: params.phone ?? '',
        plan: params.plan ?? '',
        amount: params.amount ?? '',
        date: params.date ?? '',
      },
    });
  };

  // Data purchases surface errors here so the user can retry their PIN;
  // airtime keeps routing failures to the shared result screen.
  const handleFailure = (message: string) => {
    if (isData) {
      toast.error('Data purchase failed', { description: message });
      setPin('');
      return;
    }
    goToResult('failed', message);
  };

  const purchase = async (transactionPin: string) => {
    if (!product) return;
    setSubmitting(true);
    try {
      const payload = {
        pin: transactionPin,
        unique_code: product.unique_code,
        phone_number: phoneNumber,
        amount: Number(amount),
      };
      const { message } = isData
        ? await vasService.buyData(payload)
        : await vasService.buyAirtime(payload);
      await onManualPinSuccess(transactionPin);
      // Clear the PIN so backing out of the result screen can't re-confirm
      // the purchase with a still-armed PIN.
      setPin('');
      goToResult('success', message);
    } catch (err: unknown) {
      handleFailure(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!canConfirm || submitting) return;
    purchase(pin);
  };

  const handleBiometric = async () => {
    if (authenticating || submitting) return;
    const storedPin = await authenticateWithBiometric();
    if (!storedPin) {
      // No purchase was attempted, so this is not a transaction failure —
      // keep any typed PIN and let the user continue manually.
      toast.error('Biometric authentication failed', {
        description: 'Please use your PIN instead.',
      });
      return;
    }
    purchase(storedPin);
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1.5">Enter PIN</Text>
      <Text className="text-[13px] text-[#6B7280] leading-5 mb-7">
        Enter your 4-digit PIN to confirm transaction
      </Text>

      <View className="mb-5">
        <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
          <TextInput
            className="flex-1 text-[15px] text-[#1A1A1A] p-0"
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH))}
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
        <ForgotPinLink />
      </View>

      <View className="flex-1" />

      <View className="flex-row items-center gap-3 pb-4">
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
    </SafeAreaView>
  );
}
