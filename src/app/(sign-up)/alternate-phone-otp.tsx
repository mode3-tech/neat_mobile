import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { OtpInput } from '@/components/ui/otp-input';
import { useSmsOtp } from '@/hooks/use-sms-otp';
import { ApiError } from '@/services/api';
import { authService } from '@/services/auth.service';
import { useSignUpStore } from '@/stores/sign-up.store';
import { OTP_LENGTH } from '@/constants';
import { maskPhone } from '@/utils/mask';

const PRIMARY = '#472FF8';
const RESEND_SECONDS = 30;

export default function AlternatePhoneOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const submittedPhone = useSignUpStore((s) => s.submittedPhone);
  const submittedPhoneOtpId = useSignUpStore((s) => s.submittedPhoneOtpId);
  const setSubmittedPhoneOtpId = useSignUpStore((s) => s.setSubmittedPhoneOtpId);
  const setSubmittedPhoneVerificationId = useSignUpStore(
    (s) => s.setSubmittedPhoneVerificationId,
  );

  const handleSmsOtp = useCallback((code: string) => setOtp(code), []);
  useSmsOtp({ onOtpReceived: handleSmsOtp, otpLength: OTP_LENGTH });

  const canVerify = otp.length === OTP_LENGTH;
  const canResend = seconds === 0;

  useEffect(() => {
    if (seconds === 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const startCooldown = (retryAfter?: number) =>
    setSeconds(retryAfter && retryAfter > 0 ? retryAfter : RESEND_SECONDS);

  // The backend is the real rate limiter (429 + Retry-After); this just mirrors
  // it. On 429 we seed the local countdown from the server's wait time so the
  // resend link stays disabled for exactly as long as the server says.
  const handleOtpError = (err: unknown, fallbackTitle: string) => {
    if (err instanceof ApiError && err.status === 429) {
      startCooldown(err.retryAfter);
      toast.error('Too many attempts', {
        description: err.message || 'Please wait before requesting another code.',
      });
      return;
    }
    toast.error(fallbackTitle, {
      description: err instanceof Error ? err.message : 'Please try again.',
    });
  };

  const handleResend = async () => {
    if (!canResend) return;
    if (!submittedPhone) {
      toast.error('Could not resend code', {
        description: 'Your session expired. Please restart sign-up.',
      });
      return;
    }
    setOtp('');
    startCooldown(); // optimistic — blocks a double-tap while the request is in flight
    try {
      const { otp_id, retry_after } = await authService.sendPhoneOtp(null, {
        purpose: 'submitted_contact',
        destination: submittedPhone,
      });
      setSubmittedPhoneOtpId(otp_id);
      startCooldown(retry_after);
    } catch (err: unknown) {
      handleOtpError(err, 'Could not resend code');
    }
  };

  const handleVerify = async () => {
    if (!canVerify || loading) return;
    setLoading(true);
    try {
      const result = await authService.verifyOtp(
        submittedPhoneOtpId,
        otp,
        'submitted_contact',
      );
      setSubmittedPhoneVerificationId(result.verification_id);
      router.push('/(sign-up)/nin-verification');
    } catch (err: unknown) {
      toast.error('Verification failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter OTP Code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{' '}
          <Text style={styles.phoneHighlight}>{maskPhone(submittedPhone)}</Text>
        </Text>

        <View style={styles.otpWrap}>
          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />
        </View>

        <TouchableOpacity style={styles.changeNumberBtn} onPress={() => router.back()}>
          <Text style={styles.changeNumberText}>Change number</Text>
        </TouchableOpacity>

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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  phoneHighlight: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  otpWrap: {
    marginBottom: 12,
  },
  changeNumberBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  changeNumberText: {
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
