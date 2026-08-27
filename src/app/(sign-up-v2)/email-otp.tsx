import { useState } from 'react';
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
import { useOtpCooldown } from '@/hooks/use-otp-cooldown';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { authV2Service } from '@/services/auth-v2.service';
import { useSignUpV2Store } from '@/stores/sign-up-v2.store';
import { OTP_LENGTH } from '@/constants';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';

export default function EmailOtpScreen() {
  const email = useSignUpV2Store((s) => s.email);
  const emailOtpId = useSignUpV2Store((s) => s.emailOtpId);
  const storedOtpCode = useSignUpV2Store((s) => s.emailOtpCode);
  // Read once for the initial countdown; resends reseed it through start().
  const otpSentAt = useSignUpV2Store.getState().emailOtpSentAt;
  const setEmailOtpId = useSignUpV2Store((s) => s.setEmailOtpId);
  const setEmailOtpCode = useSignUpV2Store((s) => s.setEmailOtpCode);
  const setEmailVerificationId = useSignUpV2Store((s) => s.setEmailVerificationId);

  // Seeded from the store so "Change email address" → back restores what was
  // already typed; this screen is popped off the stack in between.
  const [otp, setLocalOtp] = useState(storedOtpCode);
  const [loading, setLoading] = useState(false);
  const { canResend, timer, start, clear, absorbRateLimit } = useOtpCooldown(otpSentAt);

  const setOtp = (code: string) => {
    setLocalOtp(code);
    setEmailOtpCode(code);
  };

  const { isOffline } = useNetworkStatus();
  const canVerify = otp.length === OTP_LENGTH && !isOffline;

  const handleResend = async () => {
    if (!canResend) return;
    setOtp('');
    start(); // optimistic — blocks a double-tap while the request is in flight
    try {
      const { otp_id } = await authV2Service.requestEmailOtp(email);
      setEmailOtpId(otp_id);
    } catch (err: unknown) {
      if (absorbRateLimit(err)) {
        toast.error('Too many attempts', {
          description: err.message || 'Please wait before requesting another code.',
        });
        return;
      }
      // No code went out, so the optimistic countdown above is a lie — drop it
      // and let them tap again rather than stranding them for 90 seconds.
      clear();
      toast.error('Could not resend code', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleVerify = async () => {
    if (!canVerify || loading) return;
    setLoading(true);
    try {
      const result = await authV2Service.verifyEmailOtp(emailOtpId, otp);
      setEmailVerificationId(result.verification_id);
      // Spent — don't repopulate the field if the user navigates back here.
      setEmailOtpCode('');
      router.push('/(sign-up-v2)/bvn-verification');
    } catch (err: unknown) {
      toast.error('Verification failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-1.5">
          <BackButton className="" />
          <Text style={styles.title}>Enter OTP Code</Text>
        </View>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

        <View style={styles.otpWrap}>
          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />
        </View>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.changeLink}>Change email address</Text>
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
              <ActivityIndicator color={PRIMARY_TEXT} />
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
  title: {
    fontSize: 22,
    lineHeight: 26,
    includeFontPadding: false,
    fontWeight: '700',
    color: PRIMARY_TEXT,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 32,
  },
  otpWrap: {
    marginBottom: 12,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_TEXT,
    textDecorationLine: 'underline',
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
    color: PRIMARY_TEXT,
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
    color: PRIMARY_TEXT,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 13,
    color: PRIMARY_TEXT,
    fontWeight: '600',
  },
});
