import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
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
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/services/notification.service';
import { useNotificationStore } from '@/stores/notification.store';
import type { AppNotification, NotificationType } from '@/types/notification.types';
import { BackButton } from '@/components/ui/back-button';

// Solid tiles, one fill per category. `transaction` takes the brand yellow —
// it is both what the design draws and what frees green to mean "unread" on
// the dot, instead of green meaning two different things in the same row. For
// the same reason no tile reuses the dot's green: `promo` gets violet, which
// collides with none of the status colours (red error / green success).
const TYPE_ICONS: Record<
  NotificationType,
  { name: string; fg: string; bg: string }
> = {
  transaction: { name: 'swap-horizontal', fg: '#032252', bg: '#F9B700' },
  security: { name: 'shield-lock-outline', fg: '#FFFFFF', bg: '#EF4444' },
  loan: { name: 'wallet-outline', fg: '#FFFFFF', bg: '#032252' },
  promo: { name: 'bullhorn-outline', fg: '#FFFFFF', bg: '#7C3AED' },
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
    const t = new Date(item.created_at).getTime();
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
  const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.promo;
  const unread = !item.is_read;

  return (
    <View
    
      className={`flex-row items-start gap-3 mx-6 mb-3 p-4 rounded-2xl ${
        unread ? 'bg-[#FFFBEF]' : 'bg-[#F9FAFB]'
      }`}
      style={unread ? { borderLeftWidth: 3, borderLeftColor: '#F9B700' } : undefined}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center"
        style={{ backgroundColor: icon.bg }}
      >
        <MaterialCommunityIcons
          name={icon.name as any}
          size={22}
          color={icon.fg}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[11px] text-[#6B7280]">
            {formatRelativeTime(item.created_at)}
          </Text>
          {unread && <View className="w-2 h-2 rounded-full bg-[#16A34A]" />}
        </View>
        <Text
          className={`text-[14px] ${unread ? 'font-bold' : 'font-semibold'} text-[#032252] mb-1`}
        >
          {item.title}
        </Text>
        <Text className="text-[13px] text-[#374151] leading-[18px]">
          {item.body}
        </Text>
      </View>
    </View>
  );
}

/**
 * Loading placeholder shaped like a real row, so the list keeps its geometry
 * while the first page lands instead of flashing an empty screen.
 */
function SkeletonRow() {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{ opacity: pulse }}
      className="flex-row items-start gap-3 mx-6 mb-3 p-4 rounded-2xl bg-[#F9FAFB]"
    >
      <View className="w-11 h-11 rounded-xl bg-[#E5E7EB]" />
      <View className="flex-1 gap-2">
        <View className="h-2.5 w-16 rounded-full bg-[#E5E7EB]" />
        <View className="h-3 w-2/5 rounded-full bg-[#E5E7EB]" />
        <View className="h-2.5 w-full rounded-full bg-[#E5E7EB]" />
        <View className="h-2.5 w-3/4 rounded-full bg-[#E5E7EB]" />
      </View>
    </Animated.View>
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

  // Flatten pages and de-dupe by id in a single O(n) pass, recomputed only when
  // the query data changes (not on every render / scroll / mark-read tick).
  const notifications = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.notifications) ?? [];
    const seen = new Set<string>();
    return all.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [data]);

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
              n.id === notificationId ? { ...n, is_read: true } : n,
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
        if (!entry.isViewable || !n?.id || n.is_read) continue;
        if (viewedIdsRef.current.has(n.id)) continue;
        viewedIdsRef.current.add(n.id);
        markReadMutation.mutate(n.id);
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

  const sections = useMemo(() => groupByDate(notifications), [notifications]);
  const hasUnread = useMemo(
    () => notifications.some((n) => !n.is_read),
    [notifications],
  );

  const errorMessage = isError
    ? (error as any)?.response?.data?.error ||
      error?.message ||
      'Something went wrong'
    : '';

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Own back-button header — this screen deliberately skips HeaderScreen:
          DashboardHeader's bell pushes /notifications, which would stack a
          duplicate copy of this very screen on every tap. */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <View className="flex-1 flex-row items-center gap-2">
          <BackButton className="" />
          <Text
            numberOfLines={1}
            className="text-[22px] font-bold text-[#032252] leading-[26px]"
            style={{ includeFontPadding: false }}
          >
            Notifications
          </Text>
        </View>

        {hasUnread && (
          <TouchableOpacity
            className="shrink-0 pl-3"
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Text className="text-sm font-medium text-[#032252]">
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="pt-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
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
          keyExtractor={(item, index) => item.id ?? `notif-${index}`}
          renderItem={({ item }) => <NotificationItem item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-white px-6 pt-5 pb-3">
              <Text className="text-[11px] font-semibold text-[#1A1A1A] uppercase tracking-[1.5px]">
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
                <ActivityIndicator size="small" color="#032252" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
