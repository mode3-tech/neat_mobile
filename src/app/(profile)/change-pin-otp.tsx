import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { OTP_LENGTH, QUERY_KEYS } from '@/constants';
import { OtpInput } from '@/components/ui/otp-input';
import { authService } from '@/services/auth.service';
import { accountService } from '@/services/account.service';
import { useSecurityChangeStore } from '@/stores/security-change.store';
import { maskPhone } from '@/utils/mask';

const RESEND_SECONDS = 30;

export default function ChangePinOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  const pinChange = useSecurityChangeStore((s) => s.pinChange);
  const clearPinChange = useSecurityChangeStore((s) => s.clearPinChange);

  const { data: summary } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  useEffect(() => {
    if (!pinChange) {
      Alert.alert('Session expired', 'Please start the PIN change again.');
      router.back();
    }
  }, [pinChange]);

  useEffect(() => {
    return () => {
      useSecurityChangeStore.getState().clearPinChange();
    };
  }, []);

  useEffect(() => {
    if (seconds === 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const canResend = seconds === 0;
  const canVerify = otp.length === OTP_LENGTH;

  const handleResend = async () => {
    if (!canResend) return;
    setSeconds(RESEND_SECONDS);
    setOtp('');
    await authService.requestPinChange().catch(() => null);
  };

  const handleVerify = async () => {
    if (!canVerify || loading || !pinChange) return;
    setLoading(true);
    setError('');
    try {
      await authService.changePin({
        otp_code: otp,
        current_pin: pinChange.currentPin,
        new_pin: pinChange.newPin,
        confirm_new_pin: pinChange.confirmNewPin,
      });
      clearPinChange();
      router.replace({
        pathname: '/(profile)/success' as any,
        params: {
          title: 'PIN Changed Successfully',
          message: 'Your transaction PIN has been updated. Use your new PIN for future transactions.',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm text-gray-700 font-medium">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-2">Enter OTP Code</Text>
      <Text className="text-[13px] text-gray-500 leading-5 mb-8">
        Please check the OTP that has been sent to your phone number {maskPhone(summary?.phone_number)}.
      </Text>

      <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} length={OTP_LENGTH} />

      {error ? <Text className="text-[13px] text-[#EF4444] mt-2">{error}</Text> : null}

      <View className="flex-1" />

      <View className="pb-4">
        <TouchableOpacity
          className={`rounded-full py-4 items-center ${canVerify ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
          onPress={handleVerify}
          disabled={!canVerify || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-semibold ${canVerify ? 'text-white' : 'text-gray-400'}`}>
              Confirm
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center items-center mt-4">
          <Text className="text-[13px] text-gray-500">Didn't get a code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text className="text-[13px] text-[#472FF8] font-semibold">Resend code</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-[13px] text-[#472FF8] font-semibold">{timer}</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
