import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { OtpInput } from '@/components/ui/otp-input';
import { useSmsOtp } from '@/hooks/use-sms-otp';
import { authService } from '@/services/auth.service';
import { storeSignInCredentials } from '@/services/biometric.service';
import { useAuthStore } from '@/stores/auth.store';
import { OTP_LENGTH } from '@/constants';

const PRIMARY = '#472FF8';
const RESEND_SECONDS = 30;

export default function NewDeviceOtpScreen() {
  const params = useLocalSearchParams<{
    session_token: string;
    phone: string;
    password: string;
  }>();
  const session_token = Array.isArray(params.session_token)
    ? params.session_token[0]
    : params.session_token;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  const handleSmsOtp = useCallback((code: string) => setOtp(code), []);
  useSmsOtp({ onOtpReceived: handleSmsOtp, otpLength: OTP_LENGTH });

  const canVerify = otp.length === OTP_LENGTH;
  const canResend = seconds === 0;

  useEffect(() => {
    if (seconds === 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const handleResend = async () => {
    if (!canResend || !session_token) return;
    setSeconds(RESEND_SECONDS);
    setOtp('');
    setError('');
    try {
      await authService.resendNewDeviceOtp(session_token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  const handleVerify = async () => {
    if (!canVerify || loading || !session_token) return;
    setLoading(true);
    setError('');
    try {
      const response = await authService.verifyNewDevice(otp, session_token);

      if (response.access_token && response.refresh_token) {
        const { setTokens, setUser, setBiometricsEnabled } = useAuthStore.getState();
        setTokens(response.access_token, response.refresh_token);
        if (response.user) setUser(response.user);

        // Sync biometrics preference from backend
        if (response.is_biometrics_enabled) {
          setBiometricsEnabled(true);
          if (params.phone && params.password) {
            storeSignInCredentials(params.phone, params.password).catch(() => {});
          }
        }
      }

      router.replace('/(sign-in)/device-verified');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Device verification failed');
    } finally {
      setLoading(false);
    }
  };

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Enter OTP Code</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to your phone</Text>

      <View style={styles.otpWrap}>
        <OtpInput value={otp} onChange={(val) => { setOtp(val); setError(''); }} length={OTP_LENGTH} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, !canVerify && styles.disabledBtn]}
          onPress={handleVerify}
          disabled={!canVerify || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.primaryBtnText, !canVerify && styles.disabledBtnText]}>
              Verify Device
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't get a code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>{timer}</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 32,
  },
  otpWrap: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 16,
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
  },
  disabledBtnText: {
    color: '#9CA3AF',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
});
