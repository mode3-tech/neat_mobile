import { useEffect } from 'react';
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/services/notification.service';
import { useNotificationStore } from '@/stores/notification.store';
import type { AppNotification, NotificationType } from '@/types/notification.types';

const TYPE_ICONS: Record<NotificationType, { name: string; color: string; bg: string }> = {
  loan: { name: 'wallet-outline', color: '#472FF8', bg: '#EEF0FF' },
  transaction: { name: 'swap-horizontal', color: '#16A34A', bg: '#F0FDF4' },
  security: { name: 'shield-lock-outline', color: '#EF4444', bg: '#FEF2F2' },
  promo: { name: 'bullhorn-outline', color: '#F59E0B', bg: '#FFFBEB' },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  if (diff < 0) return 'Just now';

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.promo;

  return (
    <TouchableOpacity
      className={`flex-row items-start gap-3 px-6 py-4 ${!item.is_read ? 'bg-[#F9FAFB]' : ''}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: icon.bg }}
      >
        <MaterialCommunityIcons
          name={icon.name as any}
          size={20}
          color={icon.color}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text
            className={`text-[14px] ${!item.is_read ? 'font-bold' : 'font-medium'} text-[#1A1A1A] flex-1`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.is_read && (
            <View className="w-2 h-2 rounded-full bg-[#472FF8] ml-2" />
          )}
        </View>
        <Text className="text-[13px] text-[#6B7280] mb-1" numberOfLines={2}>
          {item.body}
        </Text>
        <Text className="text-[11px] text-[#9CA3AF]">
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons name="bell-off-outline" size={64} color="#E5E7EB" />
      <Text className="text-base font-semibold text-[#1A1A1A] mt-4">
        No notifications yet
      </Text>
      <Text className="text-[13px] text-[#6B7280] text-center mt-1">
        We'll notify you when something important happens.
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const store = useNotificationStore();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  useEffect(() => {
    if (notifications.length > 0) store.setNotifications(notifications);
  }, [notifications, store]);

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: (_, notificationId) => {
      store.markRead(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      store.markAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const handlePress = (item: AppNotification) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }

    if (item.data?.screen) {
      let params: Record<string, string> | undefined;
      try {
        params = item.data.params ? JSON.parse(item.data.params) : undefined;
      } catch {
        // Malformed params — navigate without them
      }
      router.push({ pathname: item.data.screen as any, params });
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <TouchableOpacity
          className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>

        {hasUnread && (
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Text className="text-sm font-medium text-[#472FF8]">
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="px-6 mb-4">
        <Text className="text-[22px] font-bold text-[#1A1A1A]">
          Notifications
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#472FF8" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => handlePress(item)} />
          )}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={
            notifications.length === 0 ? { flex: 1 } : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
