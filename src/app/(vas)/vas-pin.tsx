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
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { ForgotPinLink } from '@/components/ui/forgot-pin-link';
import { PIN_LENGTH, QUERY_KEYS } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { getErrorMessage } from '@/utils/error';

export default function VasPinScreen() {
  const params = useLocalSearchParams<{
    provider: string;
    phone: string;
    plan?: string;
    smartcard?: string;
    packageName?: string;
    months?: string;
    meter?: string;
    meterType?: string;
    amount: string;
    date: string;
  }>();

  const queryClient = useQueryClient();

  const categoryName = useVasStore((s) => s.categoryName);
  const biller = useVasStore((s) => s.biller);
  const product = useVasStore((s) => s.product);
  const phoneNumber = useVasStore((s) => s.phoneNumber);
  const amount = useVasStore((s) => s.amount);
  const smartcardNumber = useVasStore((s) => s.smartcardNumber);
  const noOfMonth = useVasStore((s) => s.noOfMonth);
  const meterNumber = useVasStore((s) => s.meterNumber);
  const accountType = useVasStore((s) => s.accountType);

  const isData = categoryName === 'DATA';
  const isCable = categoryName === 'CABLE TV';
  const isElectricity = categoryName === 'ELECTRICITY';

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

  const goToResult = (
    status: 'success' | 'failed',
    message: string,
    extra?: { token?: string; units?: string },
  ) => {
    router.push({
      pathname: '/(vas)/airtime-result',
      params: {
        status,
        message,
        provider: params.provider ?? '',
        phone: params.phone ?? '',
        plan: params.plan ?? '',
        smartcard: params.smartcard ?? '',
        packageName: params.packageName ?? '',
        months: params.months ?? '',
        meter: params.meter ?? '',
        meterType: params.meterType ?? '',
        token: extra?.token ?? '',
        units: extra?.units ?? '',
        amount: params.amount ?? '',
        date: params.date ?? '',
      },
    });
  };

  // Data, cable and electricity purchases surface errors here so the user can
  // retry their PIN; airtime keeps routing failures to the shared result screen.
  const handleFailure = (message: string) => {
    if (isData || isCable || isElectricity) {
      const title = isCable
        ? 'Cable subscription failed'
        : isElectricity
          ? 'Electricity payment failed'
          : 'Data purchase failed';
      toast.error(title, { description: message });
      setPin('');
      return;
    }
    goToResult('failed', message);
  };

  const purchase = async (transactionPin: string) => {
    if (!product || (isCable && !biller)) return;
    setSubmitting(true);
    try {
      let message: string;
      let token: string | undefined;
      let units: string | undefined;
      if (isCable) {
        ({ message } = await vasService.buyCable({
          pin: transactionPin,
          unique_code: product.unique_code,
          account_number: smartcardNumber,
          account_type: biller!.biller_code,
          no_of_month: noOfMonth,
          amount: Number(amount),
        }));
      } else if (isElectricity) {
        const res = await vasService.buyElectricity({
          pin: transactionPin,
          unique_code: product.unique_code,
          account_number: meterNumber,
          account_type: accountType,
          amount: Number(amount),
        });
        message = res.message;
        token = res.token;
        units = res.unit;
      } else {
        const payload = {
          pin: transactionPin,
          unique_code: product.unique_code,
          phone_number: phoneNumber,
          amount: Number(amount),
        };
        ({ message } = isData
          ? await vasService.buyData(payload)
          : await vasService.buyAirtime(payload));
      }
      await onManualPinSuccess(transactionPin);
      // Refresh the cached balance so the next VAS/transfer screen gates on the
      // post-debit balance instead of a stale one.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      // Clear the PIN so backing out of the result screen can't re-confirm
      // the purchase with a still-armed PIN.
      setPin('');
      goToResult('success', message, { token, units });
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
