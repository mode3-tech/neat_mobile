import { useCallback, useEffect, useState } from 'react';

import {
  type BiometryType,
  getBiometricType,
  getStoredTransactionPin,
  hasStoredTransactionPin,
  isBiometricAvailable,
  promptBiometric,
  storeTransactionPin,
} from '@/services/biometric.service';
import { useAuthStore } from '@/stores/auth.store';

interface UseBiometricAuthReturn {
  /** Whether the biometric button should be shown */
  isBiometricReady: boolean;
  /** 'TOUCH' | 'FACE' | 'IRIS' | 'NONE' — for choosing the icon */
  biometryType: BiometryType;
  /** Whether a biometric prompt is currently in progress */
  authenticating: boolean;
  /** Triggers biometric prompt. Returns stored PIN on success, null on failure/cancel. */
  authenticateWithBiometric: () => Promise<string | null>;
  /** Call after a successful manual PIN entry to cache the PIN for future biometric use. */
  onManualPinSuccess: (pin: string) => Promise<void>;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const biometricsHydrated = useAuthStore((s) => s.biometricsHydrated);

  const [isBiometricReady, setIsBiometricReady] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('NONE' as BiometryType);
  const [authenticating, setAuthenticating] = useState(false);
  const [deviceAvailable, setDeviceAvailable] = useState(false);

  useEffect(() => {
    if (!biometricsHydrated) return;

    let cancelled = false;

    async function check() {
      const [available, type, hasPin] = await Promise.all([
        isBiometricAvailable(),
        getBiometricType(),
        hasStoredTransactionPin(),
      ]);

      if (cancelled) return;
      setDeviceAvailable(available);
      setBiometryType(type);
      setIsBiometricReady(biometricsEnabled && available && hasPin);
    }

    check();
    return () => { cancelled = true; };
  }, [biometricsEnabled, biometricsHydrated]);

  const authenticateWithBiometric = useCallback(async (): Promise<string | null> => {
    setAuthenticating(true);
    try {
      const passed = await promptBiometric();
      if (!passed) return null;
      return await getStoredTransactionPin();
    } catch {
      return null;
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const onManualPinSuccess = useCallback(async (pin: string) => {
    if (!biometricsEnabled || !deviceAvailable) return;

    try {
      await storeTransactionPin(pin);
      setIsBiometricReady(true);
    } catch {
      // PIN storage failed — biometrics won't be available, but don't disrupt the main flow
    }
  }, [biometricsEnabled, deviceAvailable]);

  return {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  };
}
