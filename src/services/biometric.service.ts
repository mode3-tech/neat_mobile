import * as SecureStore from 'expo-secure-store';
import DeviceCrypto, { BiometryType } from 'react-native-device-crypto';

const TRANSACTION_PIN_KEY = 'transaction_pin_biometric';

export { BiometryType };

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    return await DeviceCrypto.isBiometryEnrolled();
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<BiometryType> {
  try {
    return await DeviceCrypto.getBiometryType();
  } catch {
    return BiometryType.NONE;
  }
}

interface PromptOptions {
  title?: string;
  subtitle?: string;
  description?: string;
}

export async function promptBiometric(options?: PromptOptions): Promise<boolean> {
  try {
    return await DeviceCrypto.authenticateWithBiometry({
      biometryTitle: options?.title ?? 'Confirm transaction',
      biometrySubTitle: options?.subtitle ?? 'Verify your identity',
      biometryDescription: options?.description ?? 'Authenticate to proceed with this transaction',
    });
  } catch {
    return false;
  }
}

export type BiometricPromptResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'lockout' }
  | { status: 'failed'; message?: string };

export async function promptBiometricDetailed(
  options?: PromptOptions,
): Promise<BiometricPromptResult> {
  try {
    const ok = await DeviceCrypto.authenticateWithBiometry({
      biometryTitle: options?.title ?? 'Confirm transaction',
      biometrySubTitle: options?.subtitle ?? 'Verify your identity',
      biometryDescription: options?.description ?? 'Authenticate to proceed with this transaction',
    });
    return ok ? { status: 'success' } : { status: 'cancelled' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? '');
    const code = (err as { code?: unknown })?.code;
    const haystack = `${typeof code === 'string' ? code : ''} ${message}`.toLowerCase();
    if (haystack.includes('cancel')) return { status: 'cancelled' };
    if (haystack.includes('lockout') || haystack.includes('locked')) return { status: 'lockout' };
    return { status: 'failed', message };
  }
}

export async function storeTransactionPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(TRANSACTION_PIN_KEY, pin);
}

export async function getStoredTransactionPin(): Promise<string | null> {
  return SecureStore.getItemAsync(TRANSACTION_PIN_KEY);
}

export async function clearStoredTransactionPin(): Promise<void> {
  await SecureStore.deleteItemAsync(TRANSACTION_PIN_KEY);
}

export async function hasStoredTransactionPin(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(TRANSACTION_PIN_KEY);
  return pin !== null;
}
