import { create } from 'zustand';

import type { AppNotification } from '@/types/notification.types';

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
  setUnreadCount: (count: number) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  setNotifications: (notifications) => set({ notifications }),

  markRead: (notificationId) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === notificationId);
      const wasUnread = target && !target.is_read;
      return {
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
}));
