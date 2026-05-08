import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { authService } from '@/services/auth.service';
import { storeTransactionPin } from '@/services/biometric.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSignUpStore } from '@/stores/sign-up.store';
import { getErrorMessage } from '@/utils/error';

const PRIMARY = '#472FF8';
const POLL_INTERVAL_MS = 3000;
const SLOW_NETWORK_THRESHOLD_MS = 30000;

type Phase = 'polling' | 'claiming' | 'failed';

export default function RegistrationProcessingScreen() {
  const store = useSignUpStore();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setBiometricsEnabled = useAuthStore((s) => s.setBiometricsEnabled);

  const [phase, setPhase] = useState<Phase>('polling');
  const [statusMessage, setStatusMessage] = useState(
    'Setting up your account…',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const claimingRef = useRef(false);
  const cancelledRef = useRef(false);

  const stopPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  };

  const scheduleNextPoll = () => {
    if (cancelledRef.current || claimingRef.current) return;
    pollTimeoutRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS);
  };

  const finalizeWithClaim = async () => {
    if (claimingRef.current) return;
    claimingRef.current = true;
    stopPolling();
    setPhase('claiming');
    setStatusMessage('Finishing up…');

    const { jobId, claimToken, transactionPin, biometricsEnabled } =
      useSignUpStore.getState();

    if (!jobId || !claimToken) {
      if (cancelledRef.current) return;
      toast.error('Session expired', {
        description: 'Please sign in to continue.',
      });
      store.reset();
      router.replace('/(sign-in)/sign-in');
      return;
    }

    try {
      const tokens = await authService.claimRegistrationSession(
        jobId,
        claimToken,
      );
      if (cancelledRef.current) return;

      setTokens(tokens.access_token, tokens.refresh_token);
      setBiometricsEnabled(biometricsEnabled);

      if (biometricsEnabled) {
        try {
          await storeTransactionPin(transactionPin);
        } catch {
          // Non-blocking — biometrics just won't be available until next manual login
        }
      }

      if (cancelledRef.current) return;
      store.reset();
      router.replace('/(sign-up)/registration-success');
    } catch (err: unknown) {
      if (cancelledRef.current) return;
      toast.error('Session expired', {
        description: getErrorMessage(err, 'Please sign in to continue.'),
      });
      store.reset();
      router.replace('/(sign-in)/sign-in');
    }
  };

  const pollOnce = async () => {
    const { jobId } = useSignUpStore.getState();
    if (!jobId) return;
    try {
      const status = await authService.getRegistrationStatus(jobId);
      if (cancelledRef.current) return;

      if (status.registration_status === 'completed') {
        finalizeWithClaim();
        return;
      }

      if (status.registration_status === 'failed') {
        stopPolling();
        setPhase('failed');
        setErrorMessage(
          status.error || status.message || 'Registration failed',
        );
        return;
      }

      // pending | processing — keep polling
      if (status.message) setStatusMessage(status.message);
      scheduleNextPoll();
    } catch {
      if (cancelledRef.current) return;
      // Network blip — back off one tick and retry
      scheduleNextPoll();
    }
  };

  const startPolling = () => {
    stopPolling();
    claimingRef.current = false;
    setShowSlowMessage(false);
    pollOnce(); // immediate first check; subsequent polls self-schedule
    slowTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setShowSlowMessage(true);
    }, SLOW_NETWORK_THRESHOLD_MS);
  };

  useEffect(() => {
    cancelledRef.current = false;
    startPolling();
    return () => {
      cancelledRef.current = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    setErrorMessage('');
    claimingRef.current = false;
    try {
      const result = await authService.registerUser({
        email: store.email,
        password: store.password,
        confirm_password: store.password,
        transaction_pin: store.transactionPin,
        confirm_transaction_pin: store.transactionPin,
        bvn_verification_id: store.bvnData?.verification_id ?? '',
        nin_verification_id: store.ninData?.verification_id ?? '',
        phone_verification_id: store.phoneVerificationId,
        email_verification_id: store.emailVerificationId,
        is_biometrics_enabled: store.biometricsEnabled,
      });
      if (cancelledRef.current) return;

      store.setRegistrationJob(
        result.job_id,
        result.claim_token,
        result.claim_expires_at,
      );

      setPhase('polling');
      setStatusMessage('Setting up your account…');
      startPolling();
    } catch (err: unknown) {
      if (cancelledRef.current) return;
      setErrorMessage(getErrorMessage(err, 'Something went wrong'));
    } finally {
      if (!cancelledRef.current) setRetrying(false);
    }
  };

  const handleSignInInstead = () => {
    cancelledRef.current = true;
    stopPolling();
    store.reset();
    router.replace('/(sign-in)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {phase === 'failed' ? (
          <>
            <View style={styles.errorCircle}>
              <Text style={styles.errorMark}>!</Text>
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>{errorMessage}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={[styles.title, styles.titleSpaced]}>
              {statusMessage}
            </Text>
            {showSlowMessage && phase === 'polling' ? (
              <Text style={styles.subtitle}>
                Still working… this is taking a bit longer than usual.
              </Text>
            ) : null}
          </>
        )}
      </View>

      {phase === 'failed' ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleRetry}
            disabled={retrying}
            activeOpacity={0.85}
          >
            {retrying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Retry</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSignInInstead}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Sign in instead</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleSpaced: {
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorMark: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 16,
    gap: 8,
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
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '500',
  },
});
