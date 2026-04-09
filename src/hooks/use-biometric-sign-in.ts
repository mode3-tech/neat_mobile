import { useCallback, useEffect, useState } from 'react';

import {
  type BiometryType,
  getBiometricType,
  getStoredSignInCredentials,
  hasStoredSignInCredentials,
  isBiometricAvailable,
  promptBiometric,
} from '@/services/biometric.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

type SignInResult =
  | { status: 'success' }
  | { status: 'new_device'; sessionToken: string }
  | { status: 'failed'; error: string };

interface UseBiometricSignInReturn {
  /** Whether the biometric sign-in button should be shown */
  isBiometricSignInReady: boolean;
  /** 'TOUCH' | 'FACE' | 'IRIS' | 'NONE' — for choosing the icon */
  biometryType: BiometryType;
  /** Whether a biometric sign-in is currently in progress */
  authenticating: boolean;
  /** Triggers biometric prompt then auto-login. Returns result for the screen to handle navigation. */
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
      const [available, type, hasCreds] = await Promise.all([
        isBiometricAvailable(),
        getBiometricType(),
        hasStoredSignInCredentials(),
      ]);

      if (cancelled) return;
      setBiometryType(type);
      setIsBiometricSignInReady(biometricsEnabled && available && hasCreds);
    }

    check();
    return () => { cancelled = true; };
  }, [biometricsEnabled, biometricsHydrated]);

  const signInWithBiometric = useCallback(async (): Promise<SignInResult> => {
    setAuthenticating(true);
    try {
      const passed = await promptBiometric({
        title: 'Sign in to NEAT',
        subtitle: 'Verify your identity',
        description: 'Authenticate to sign in',
      });
      if (!passed) return { status: 'failed', error: 'Biometric authentication cancelled' };

      const credentials = await getStoredSignInCredentials();
      if (!credentials) return { status: 'failed', error: 'No stored credentials found' };

      const response = await authService.loginUser(credentials.phone, credentials.password);

      if (response.status === 'success' && response.access_token && response.refresh_token) {
        const { setTokens, setUser } = useAuthStore.getState();
        setTokens(response.access_token, response.refresh_token);
        if (response.user) setUser(response.user);
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
