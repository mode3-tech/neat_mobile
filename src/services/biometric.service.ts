import * as SecureStore from 'expo-secure-store';
import DeviceCrypto, { BiometryType } from 'react-native-device-crypto';

const TRANSACTION_PIN_KEY = 'transaction_pin_biometric';
const PASSWORD_KEY = 'biometric_password';
const PHONE_KEY = 'biometric_phone';

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

// --- Sign-in credential storage ---

export async function storeSignInCredentials(phone: string, password: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(PHONE_KEY, phone),
    SecureStore.setItemAsync(PASSWORD_KEY, password),
  ]);
}

export async function getStoredSignInCredentials(): Promise<{ phone: string; password: string } | null> {
  const [phone, password] = await Promise.all([
    SecureStore.getItemAsync(PHONE_KEY),
    SecureStore.getItemAsync(PASSWORD_KEY),
  ]);
  if (!phone || !password) return null;
  return { phone, password };
}

export async function clearStoredSignInCredentials(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(PHONE_KEY),
    SecureStore.deleteItemAsync(PASSWORD_KEY),
  ]);
}

export async function hasStoredSignInCredentials(): Promise<boolean> {
  const [phone, password] = await Promise.all([
    SecureStore.getItemAsync(PHONE_KEY),
    SecureStore.getItemAsync(PASSWORD_KEY),
  ]);
  return phone !== null && password !== null;
}
