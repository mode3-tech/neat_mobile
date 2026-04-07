import { create } from 'zustand';

import type {
  AppNotification,
  PaginatedNotificationsResponse,
} from '@/types/notification.types';

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  setUnreadCount: (count: number) => void;
  setNotifications: (response: PaginatedNotificationsResponse) => void;
  appendNotifications: (response: PaginatedNotificationsResponse) => void;
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
  resetPagination: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  page: 0,
  pageSize: 20,
  total: 0,
  hasNext: false,

  setUnreadCount: (count) => set({ unreadCount: count }),

  setNotifications: (response) =>
    set({
      notifications: response.notifications,
      page: response.page,
      pageSize: response.page_size,
      total: response.total,
      hasNext: response.has_next,
    }),

  appendNotifications: (response) =>
    set((state) => {
      const existingIds = new Set(state.notifications.map((n) => n.ID));
      const newItems = response.notifications.filter(
        (n) => !existingIds.has(n.ID),
      );
      return {
        notifications: [...state.notifications, ...newItems],
        page: response.page,
        pageSize: response.page_size,
        total: response.total,
        hasNext: response.has_next,
      };
    }),

  markRead: (notificationId) =>
    set((state) => {
      const target = state.notifications.find((n) => n.ID === notificationId);
      const wasUnread = target && !target.IsRead;
      return {
        notifications: state.notifications.map((n) =>
          n.ID === notificationId
            ? { ...n, IsRead: true, ReadAt: new Date().toISOString() }
            : n,
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        IsRead: true,
        ReadAt: n.ReadAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  resetPagination: () =>
    set({
      notifications: [],
      page: 0,
      total: 0,
      hasNext: false,
    }),
}));
