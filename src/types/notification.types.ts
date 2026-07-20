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
  amount?: number;
  reference?: string;
  type?: string;
}

/**
 * Data bag carried by a push notification. Distinct from `NotificationData`
 * above, which types the in-app notification list from the backend — these are
 * the fields the push itself carries, and the two have drifted apart before.
 */
export interface StatementReadyPushData {
  event: 'statement-ready';
  job_id: string;
  format?: 'pdf' | 'xlsx';
}

export interface CreditAlertPushData {
  event?: string;
  transaction_id: string;
  amount?: number;
  reference?: string;
}

export interface GenericPushData {
  event?: string;
  [key: string]: unknown;
}

export type PushNotificationData =
  | StatementReadyPushData
  | CreditAlertPushData
  | GenericPushData;

export type NotificationType = 'loan' | 'transaction' | 'security' | 'promo';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: NotificationData;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface PaginatedNotificationsResponse {
  notifications: AppNotification[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

export interface MarkReadResponse {
  updated: boolean;
}

export interface MarkAllReadResponse {
  updated: number;
}
