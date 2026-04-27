import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  SectionList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

function groupByDate(
  items: AppNotification[],
): { title: string; data: AppNotification[] }[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const yesterdayMs = todayMs - 86_400_000;
  const weekAgoMs = todayMs - 6 * 86_400_000;

  const buckets: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    'This week': [],
    Earlier: [],
  };

  for (const item of items) {
    const t = new Date(item.CreatedAt).getTime();
    if (t >= todayMs) buckets.Today.push(item);
    else if (t >= yesterdayMs) buckets.Yesterday.push(item);
    else if (t >= weekAgoMs) buckets['This week'].push(item);
    else buckets.Earlier.push(item);
  }

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

function NotificationItem({ item }: { item: AppNotification }) {
  const icon = TYPE_ICONS[item.Type] ?? TYPE_ICONS.promo;

  return (
    <View
      className="flex-row items-start gap-3 mx-6 mb-3 p-4 rounded-2xl bg-[#F9FAFB] border border-[#F3F4F6]"
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{
          backgroundColor: icon.bg,
          borderWidth: 1,
          borderColor: icon.color + '20',
        }}
      >
        <MaterialCommunityIcons
          name={icon.name as any}
          size={22}
          color={icon.color}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[11px] text-[#29292a]">
            {formatRelativeTime(item.CreatedAt)}
          </Text>
          {!item.IsRead && (
            <View className="w-2 h-2 rounded-full bg-[#472FF8]" />
          )}
        </View>
        <Text
          className={`text-[14px] ${!item.IsRead ? 'font-bold' : 'font-semibold'} text-[#272626] mb-1`}
        >
          {item.Title}
        </Text>
        <Text className="text-[13px] text-[#161617] leading-[18px]">
          {item.Body}
        </Text>
      </View>
    </View>
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
        {"We'll notify you when something important happens."}
      </Text>
    </View>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons name="wifi-off" size={64} color="#E5E7EB" />
      <Text className="text-base font-semibold text-[#1A1A1A] mt-4">
        {message}
      </Text>
      <Text className="text-[13px] text-[#6B7280] text-center mt-1">
        Pull down to try again
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const setStoreNotifications = useNotificationStore((s) => s.setNotifications);
  const markStoreRead = useNotificationStore((s) => s.markRead);
  const markStoreAllRead = useNotificationStore((s) => s.markAllRead);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isRefetching,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.has_next ? lastPage.page + 1 : undefined,
  });

  const allNotifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const notifications = allNotifications.filter(
    (n, i, arr) => arr.findIndex((x) => x.ID === n.ID) === i,
  );

  useEffect(() => {
    if (!data?.pages.length) return;
    const allNotifications = data.pages.flatMap((p) => p.notifications);
    const lastPage = data.pages[data.pages.length - 1];
    setStoreNotifications({
      notifications: allNotifications,
      page: lastPage.page,
      page_size: lastPage.page_size,
      total: lastPage.total,
      has_next: lastPage.has_next,
    });
  }, [data, setStoreNotifications]);

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: (_, notificationId) => {
      markStoreRead(notificationId);
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((n: AppNotification) =>
              n.ID === notificationId ? { ...n, IsRead: true } : n,
            ),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      markStoreAllRead();
      queryClient.resetQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const viewedIdsRef = useRef(new Set<string>());

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 500,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      for (const entry of viewableItems) {
        const n = entry.item as AppNotification | null;
        if (!entry.isViewable || !n?.ID || n.IsRead) continue;
        if (viewedIdsRef.current.has(n.ID)) continue;
        viewedIdsRef.current.add(n.ID);
        markReadMutation.mutate(n.ID);
      }
    },
  );

  const handleRefresh = useCallback(() => {
    viewedIdsRef.current.clear();
    queryClient.resetQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sections = groupByDate(notifications);
  const hasUnread = notifications.some((n) => !n.IsRead);

  const errorMessage = isError
    ? (error as any)?.response?.data?.error ||
      error?.message ||
      'Something went wrong'
    : '';

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
      ) : isError && notifications.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={<ErrorState message={errorMessage} />}
          contentContainerStyle={{ flex: 1 }}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.ID ?? `notif-${index}`}
          renderItem={({ item }) => <NotificationItem item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-white px-6 pt-5 pb-3">
              <Text className="text-[11px] font-semibold text-[#2c2d2d] uppercase tracking-[1.5px]">
                {title}
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={
            notifications.length === 0 ? { flex: 1 } : undefined
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={handleRefresh}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#472FF8" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
