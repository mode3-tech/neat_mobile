export interface PushTokenPayload {
  expo_push_token: string;
  device_id: string;
  platform: 'ios' | 'android';
}

export interface NotificationData {
  screen?: string;
  params?: string;
}

export type NotificationType = 'loan' | 'transaction' | 'security' | 'promo';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: NotificationData;
  is_read: boolean;
  created_at: string;
}
