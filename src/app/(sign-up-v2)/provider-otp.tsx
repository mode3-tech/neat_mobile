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

/**
 * The wallet provider's own OTP step. Only reached when /validate/bvn came back
 * with requires_otp: true (Optimus); Providus accounts skip straight past this
 * screen. The client never chooses a provider — it only reacts to that flag.
 */
export default function ProviderOtpScreen() {
  const phone = useSignUpV2Store((s) => s.phone);
  const email = useSignUpV2Store((s) => s.email);
  const referenceId = useSignUpV2Store((s) => s.providerReferenceId);
  const setProviderReferenceId = useSignUpV2Store((s) => s.setProviderReferenceId);

  // Read once for the initial countdown; resends reseed it through start().
  const otpSentAt = useSignUpV2Store.getState().providerOtpSentAt;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { canResend, timer, start, clear, absorbRateLimit } = useOtpCooldown(otpSentAt);

  const { isOffline } = useNetworkStatus();
  const canVerify = otp.length === OTP_LENGTH && !isOffline && !!referenceId;

  const handleResend = async () => {
    if (!canResend) return;
    setOtp('');
    start(); // optimistic — blocks a double-tap while the request is in flight
    try {
      const result = await authV2Service.resendProviderOtp(referenceId);
      // The resend mints a NEW reference and kills the old one. Failing to
      // store it here would make the next verify fail against a dead ref.
      setProviderReferenceId(result.reference_id);
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
      await authV2Service.verifyProviderOtp({
        phone_no: phone,
        otp_token: otp,
        email,
        reference_id: referenceId,
      });
      router.push('/(sign-up-v2)/personal-details');
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
          <Text style={styles.title}>Confirm your BVN</Text>
        </View>
        <Text style={styles.subtitle}>
          Your bank sent a 6-digit code to the phone number registered on your
          BVN. Enter it to finish verifying.
        </Text>

        <View style={styles.otpWrap}>
          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />
        </View>

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
