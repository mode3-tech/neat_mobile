import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { HeaderScreen } from '@/components/ui/header-screen';
import { ForgotPinLink } from '@/components/ui/forgot-pin-link';
import { PIN_LENGTH } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { savingsService } from '@/services/savings.service';
import { useSavingsStore } from '@/stores/savings.store';
import { getErrorMessage } from '@/utils/error';
import { BackButton } from '@/components/ui/back-button';

export default function SavingsPinScreen() {
  const store = useSavingsStore();
  const queryClient = useQueryClient();
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

  const submitDeposit = async (transactionPin: string) => {
    setSubmitting(true);
    try {
      await savingsService.deposit({
        amount: parseFloat(store.amount),
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      queryClient.invalidateQueries({ queryKey: ['account-summary'] });
      store.reset();
      router.replace('/Dashboard');
    } catch (err: unknown) {
      toast.error('Deposit failed', { description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!canConfirm || submitting) return;
    submitDeposit(pin);
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
    submitDeposit(storedPin);
  };

  return (
    <HeaderScreen padded={false}>
      <KeyboardAvoidingView
        className="flex-1 px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-1.5">
          <BackButton className="" />
          <Text
            className="text-[22px] font-bold text-[#032252] leading-[26px]"
            style={{ includeFontPadding: false }}
          >
            Enter PIN
          </Text>
        </View>
        <Text className="text-[13px] text-[#6B7280] leading-5 mb-7">
          Enter your 4-digit PIN to confirm deposit
        </Text>

        <View className="mb-5">
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
            <TextInput
              className="flex-1 text-[15px] text-[#1A1A1A] p-0"
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
          <ForgotPinLink />
        </View>

        <View className="flex-1" />

        <View className="flex-row items-center gap-3 pb-4">
          <TouchableOpacity
            className={`flex-1 rounded-full py-4 items-center ${canConfirm ? 'bg-[#F9B700]' : 'bg-[#E5E7EB]'}`}
            onPress={handleConfirm}
            disabled={!canConfirm || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#032252" />
            ) : (
              <Text className={`text-base font-semibold ${canConfirm ? 'text-[#032252]' : 'text-[#9CA3AF]'}`}>
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
                color="#032252"
              />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </HeaderScreen>
  );
}
