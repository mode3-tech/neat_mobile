import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { api, throwApiError } from './api';
import { getOrCreateDeviceId } from './device.service';
import type { ApiEnvelope } from '@/types/api.types';
import type {
  AppNotification,
  PushTokenPayload,
  PaginatedNotificationsResponse,
  MarkReadResponse,
  MarkAllReadResponse,
} from '@/types/notification.types';

const PUSH_TOKEN_KEY = 'expo_push_token';
const PERMISSION_DENIED_KEY = 'push_permission_denied';
export let isRegistering = false;

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

    await api.post<ApiEnvelope>('/notifications/token', payload);
  } catch {
    // Backend endpoint may not be available yet — token is stored locally
    // and will be sent on next app foreground once the endpoint is ready
  }
}

export async function removeTokenFromBackend(): Promise<void> {
  try {
    await api.delete<ApiEnvelope>('/notifications/token');
  } catch {
    // Fire-and-forget — backend cleans up stale tokens via receipt checks
  }
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

// ── Notification History (in-app bell) ────────────────────────────────

// The backend returns the notification array directly in `data` with
// pagination fields at the top level: { data: [...], page, limit, total }
interface NotificationsListResponse {
  data: AppNotification[] | null;
  page: number;
  limit: number;
  total: number;
}

export async function getNotifications(
  page: number = 1,
): Promise<PaginatedNotificationsResponse> {
  try {
    const response = await api.get<NotificationsListResponse>('/notifications', {
      params: { page },
    });
    const { data: notifications, page: currentPage, limit, total } = response.data;
    return {
      notifications: notifications ?? [],
      page: currentPage,
      page_size: limit,
      total,
      has_next: currentPage * limit < total,
    };
  } catch {
    return { notifications: [], page: 1, page_size: 20, total: 0, has_next: false };
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const response = await api.get<ApiEnvelope<{ count: number }>>(
      '/notifications/unread-count',
    );
    return response.data.data.count;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<MarkReadResponse> {
  try {
    const response = await api.patch<ApiEnvelope<MarkReadResponse>>(
      `/notifications/${notificationId}/read`,
    );
    return response.data.data;
  } catch (error) {
    throwApiError(error, 'Failed to mark notification as read');
  }
}

export async function markAllAsRead(): Promise<MarkAllReadResponse> {
  try {
    const response = await api.patch<ApiEnvelope<MarkAllReadResponse>>(
      '/notifications/read-all',
    );
    return response.data.data;
  } catch (error) {
    throwApiError(error, 'Failed to mark all notifications as read');
  }
}

export async function toggleNotifications(enabled: boolean): Promise<void> {
  try {
    await api.post<ApiEnvelope>('/notifications/toggle', { is_enabled: enabled });
  } catch (error) {
    throwApiError(error, 'Failed to update notification settings');
  }
}
