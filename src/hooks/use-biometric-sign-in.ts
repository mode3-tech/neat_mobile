import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  type BiometryType,
  getBiometricType,
  isBiometricAvailable,
} from '@/services/biometric.service';
import { authService } from '@/services/auth.service';
import { getOrCreateDeviceId, signChallenge } from '@/services/device.service';
import { useAuthStore } from '@/stores/auth.store';

type SignInResult =
  | { status: 'success' }
  | { status: 'new_device'; sessionToken: string }
  | { status: 'failed'; error: string };

function classifySignError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const code = (err as { code?: unknown })?.code;
  const haystack = `${typeof code === 'string' ? code : ''} ${message}`.toLowerCase();

  if (haystack.includes('cancel')) {
    return 'Biometric authentication cancelled';
  }
  if (haystack.includes('lockout') || haystack.includes('locked')) {
    return 'Too many attempts. Please try again in a moment.';
  }
  if (haystack.includes('invalidated')) {
    return 'Biometric key is no longer valid. Please sign in with your password.';
  }
  return 'Biometric authentication failed';
}

interface UseBiometricSignInReturn {
  /** Whether the biometric sign-in button should be shown */
  isBiometricSignInReady: boolean;
  /** 'TOUCH' | 'FACE' | 'IRIS' | 'NONE' — for choosing the icon */
  biometryType: BiometryType;
  /** Whether a biometric sign-in is currently in progress */
  authenticating: boolean;
  /** Requests a challenge, signs it with the device key (triggers biometric prompt), then verifies. */
  signInWithBiometric: () => Promise<SignInResult>;
}

export function useBiometricSignIn(): UseBiometricSignInReturn {
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const biometricsHydrated = useAuthStore((s) => s.biometricsHydrated);

  const [isBiometricSignInReady, setIsBiometricSignInReady] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('NONE' as BiometryType);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    if (!biometricsHydrated) return;

    let cancelled = false;

    async function check() {
      const [available, type, refreshToken] = await Promise.all([
        isBiometricAvailable(),
        getBiometricType(),
        SecureStore.getItemAsync('refresh_token'),
      ]);

      if (cancelled) return;
      setBiometryType(type);
      setIsBiometricSignInReady(biometricsEnabled && available && !!refreshToken);
    }

    check();
    return () => { cancelled = true; };
  }, [biometricsEnabled, biometricsHydrated]);

  const signInWithBiometric = useCallback(async (): Promise<SignInResult> => {
    setAuthenticating(true);
    try {
      const { challenge } = await authService.requestChallenge();
      if (!challenge) {
        return { status: 'failed', error: 'Invalid challenge from server' };
      }

      let signature: string;
      try {
        signature = await signChallenge(challenge);
      } catch (err) {
        return { status: 'failed', error: classifySignError(err) };
      }

      const deviceId = await getOrCreateDeviceId();
      const response = await authService.verifyDevice(challenge, signature, deviceId);

      if (response.access_token && response.refresh_token) {
        const { setTokens, setUser, setBiometricsEnabled } = useAuthStore.getState();
        setTokens(response.access_token, response.refresh_token);
        if (response.user) setUser(response.user);
        if (typeof response.is_biometrics_enabled === 'boolean') {
          setBiometricsEnabled(response.is_biometrics_enabled);
        }
        return { status: 'success' };
      }

      if (response.status === 'new_device_detected') {
        if (!response.session_token) {
          return { status: 'failed', error: 'Server error: missing session token' };
        }
        return { status: 'new_device', sessionToken: response.session_token };
      }

      return { status: 'failed', error: 'Unexpected response from server' };
    } catch (err: any) {
      return { status: 'failed', error: err.message ?? 'Sign-in failed' };
    } finally {
      setAuthenticating(false);
    }
  }, []);

  return {
    isBiometricSignInReady,
    biometryType,
    authenticating,
    signInWithBiometric,
  };
}
