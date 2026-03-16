import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import DeviceCrypto, { AccessLevel } from 'react-native-device-crypto';
import uuid from 'react-native-uuid';

import type { DeviceInfo } from '@/types/device.types';

const DEVICE_ID_KEY = 'secure_device_id';
const KEY_ALIAS = 'user_binding_key';

let deviceIdPromise: Promise<string> | null = null;

export function isRunningOnRealDevice(): boolean {
  if (!Device.isDevice) {
    throw new Error('This app cannot run on an emulator');
  }
  return true;
}

export function getOrCreateDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (existing) return existing;

      const id = uuid.v4() as string;
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
      return id;
    })();
  }
  return deviceIdPromise;
}

export async function getOrCreateKeyPair(): Promise<string> {
  const publicKey = await DeviceCrypto.getOrCreateAsymmetricKey(KEY_ALIAS, {
    accessLevel: AccessLevel.ALWAYS,
  });
  // Strip PEM headers and newlines — backend expects raw base64
  return publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '')
    .trim();
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const [deviceId, publicKey] = await Promise.all([
    getOrCreateDeviceId(),
    getOrCreateKeyPair(),
  ]);

  return {
    device_id: deviceId,
    public_key: publicKey,
    device_name: Device.deviceName ?? 'Unknown',
    device_model: Device.modelName ?? 'Unknown',
    os: Platform.OS,
    os_version: Device.osVersion ?? 'Unknown',
    app_version: Application.nativeApplicationVersion ?? '1.0.0',
    // user_agent: 'NeatApp/1.0',
  };
}

export async function signChallenge(challenge: string): Promise<string> {
  // Ensure the key pair exists before attempting to sign
  await getOrCreateKeyPair();

  const signature = await DeviceCrypto.sign(KEY_ALIAS, challenge, {
    biometryTitle: 'Confirm your identity',
    biometrySubTitle: 'Authentication required',
    biometryDescription: 'Please authenticate to continue',
  });
  return signature;
}
