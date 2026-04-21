import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

import { api } from './api';
import { getOrCreateDeviceId } from './device.service';
import type {
  PushTokenPayload,
  PaginatedNotificationsResponse,
  MarkReadResponse,
  MarkAllReadResponse,
} from '@/types/notification.types';

const PUSH_TOKEN_KEY = 'expo_push_token';
const PERMISSION_DENIED_KEY = 'push_permission_denied';
export let isRegistering = false;

function extractErrorMessage(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  throw new Error(fallback);
}

// ── Android Channels ──────────────────────────────────────────────────

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('transactions', {
    name: 'Transactions & Loans',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync('security', {
    name: 'Security Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 500, 250, 500],
  });
}

// ── Token Registration ────────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    await SecureStore.setItemAsync(PERMISSION_DENIED_KEY, 'true');
    return null;
  }

  // Permission granted — clear any previous denial flag
  await SecureStore.deleteItemAsync(PERMISSION_DENIED_KEY);

  await setupNotificationChannels();

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('EAS project ID not found in app config');
    return null;
  }

  isRegistering = true;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    // console.log('📬 Expo Push Token:', token);

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    return token;
  } finally {
    isRegistering = false;
  }
}

export async function sendTokenToBackend(token: string): Promise<void> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const payload: PushTokenPayload = {
      expo_push_token: token,
      device_id: deviceId,
      platform: Platform.OS as 'ios' | 'android',
    };

    await api.post('/notifications/token', payload);
  } catch {
    // Backend endpoint may not be available yet — token is stored locally
    // and will be sent on next app foreground once the endpoint is ready
  }
}

export async function removeTokenFromBackend(): Promise<void> {
  try {
    await api.delete('/notifications/token');
  } catch {
    // Fire-and-forget — backend cleans up stale tokens via receipt checks
  }
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

// ── Notification History (in-app bell) ────────────────────────────────

export async function getNotifications(
  page: number = 1,
): Promise<PaginatedNotificationsResponse> {
  try {
    const { data } = await api.get<PaginatedNotificationsResponse>(
      '/notifications',
      { params: { page } },
    );
    return data;
  } catch {
    return { notifications: [], page: 1, page_size: 20, total: 0, has_next: false };
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<MarkReadResponse> {
  const { data } = await api.patch<MarkReadResponse>(
    `/notifications/${notificationId}/read`,
  );
  return data;
}

export async function markAllAsRead(): Promise<MarkAllReadResponse> {
  const { data } = await api.patch<MarkAllReadResponse>('/notifications/read-all');
  return data;
}

export async function toggleNotifications(enabled: boolean): Promise<void> {
  try {
    await api.post('/notifications/toggle', { is_enabled: enabled });
  } catch (error) {
    extractErrorMessage(error, 'Failed to update notification settings');
  }
}
