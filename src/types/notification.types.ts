export interface PushTokenPayload {
  expo_push_token: string;
  device_id: string;
  platform: 'ios' | 'android';
}

export interface NotificationData {
  application_ref?: string;
  core_loan_id?: string;
  event?: string;
  loan_status?: string;
}

export type NotificationType = 'loan' | 'transaction' | 'security' | 'promo';

export interface AppNotification {
  ID: string;
  UserID: string;
  Title: string;
  Body: string;
  Type: NotificationType;
  Data?: NotificationData;
  IsRead: boolean;
  CreatedAt: string;
  ReadAt: string | null;
}

export interface PaginatedNotificationsResponse {
  notifications: AppNotification[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

export interface MarkReadResponse {
  message: string;
  updated: boolean;
}

export interface MarkAllReadResponse {
  message: string;
  updated: number;
}
