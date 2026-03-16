import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { OtpInput } from '@/components/ui/otp-input';
import { authService } from '@/services/auth.service';
import { useSignUpStore } from '@/stores/sign-up.store';
import { OTP_LENGTH } from '@/constants';

const PRIMARY = '#472FF8';
const RESEND_SECONDS = 30;

export default function EmailOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const email = useSignUpStore((s) => s.email);
  const setEmailVerificationId = useSignUpStore((s) => s.setEmailVerificationId);

  const canVerify = otp.length === OTP_LENGTH;
  const canResend = seconds === 0;

  useEffect(() => {
    if (seconds === 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const handleResend = async () => {
    if (!canResend) return;
    setSeconds(RESEND_SECONDS);
    setOtp('');
    await authService.sendEmailOtp(email).catch(() => null);
  };

  const handleVerify = async () => {
    if (!canVerify || loading) return;
    setLoading(true);
    try {
      const result = await authService.verifyEmailOtp(email, otp);
      setEmailVerificationId(result.verification_id);
      router.push('/(sign-up)/create-password');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'OTP verification failed');
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
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{' '}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.otpWrap}>
        <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />
      </View>

      {canVerify && (
        <TouchableOpacity style={styles.changeEmailBtn} onPress={() => router.back()}>
          <Text style={styles.changeEmailText}>Change email</Text>
        </TouchableOpacity>
      )}

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
              Verify & Continue
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
  emailHighlight: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  otpWrap: {
    marginBottom: 12,
  },
  changeEmailBtn: {
    alignSelf: 'flex-end',
  },
  changeEmailText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
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
