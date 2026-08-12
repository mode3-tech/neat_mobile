import { useState, useEffect, useCallback } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { useProfileStore } from '@/stores/profile.store';
import { getUnreadCount } from '@/services/notification.service';
import { accountService } from '@/services/account.service';
import BalanceCardCarousel from '@/components/features/dashboard/BalanceCardCarousel';
import ServicesGrid from '@/components/features/dashboard/ServicesGrid';
import PromoCard from '@/components/features/dashboard/PromoCard';
import RecentTransactions from '@/components/features/dashboard/RecentTransactions';
import ActiveLoanCard from '@/components/features/dashboard/ActiveLoanCard';
import RepaymentBottomSheet from '@/components/features/loans/RepaymentBottomSheet';
import { PrimaryRefreshControl } from '@/components/ui/refresh-control';

const HEADER_BG = '#032252';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repaymentOpen, setRepaymentOpen] = useState(false);
  const photoUri = useProfileStore((s) => s.photoUri);
  const photoCacheBuster = useProfileStore((s) => s.photoCacheBuster);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['unread-count'] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_TRANSACTIONS] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { data: fetchedCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
  });

  const { data: accountSummary, dataUpdatedAt: summaryUpdatedAt } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  useEffect(() => {
    if (fetchedCount !== undefined) setUnreadCount(fetchedCount);
  }, [fetchedCount, setUnreadCount]);

  const fullName = accountSummary?.full_name ?? user?.firstName ?? '';
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? '';
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0]!.charAt(0)}${nameParts[nameParts.length - 1]!.charAt(0)}`.toUpperCase()
      : firstName.charAt(0).toUpperCase() || 'U';

  const hasActiveLoan = (accountSummary?.active_loans?.length ?? 0) > 0;

  const rawAvatarUri: string | null = accountSummary?.profile_picture || photoUri || null;
  const avatarUri = (() => {
    if (!rawAvatarUri) return null;
    if (!/^https?:\/\//.test(rawAvatarUri) || photoCacheBuster === 0) {
      return rawAvatarUri;
    }
    const sep = rawAvatarUri.includes('?') ? '&' : '?';
    return `${rawAvatarUri}${sep}v=${photoCacheBuster}`;
  })();

  useEffect(() => {
    setImageLoadFailed(false);
  }, [avatarUri, summaryUpdatedAt]);


  const isFocused = useIsFocused();

  return (
    <View className="flex-1 bg-white">
      {isFocused && <StatusBar style="light" />}
      {/* Header (pinned — stays fixed above the scrolling content) */}
      <View
        className="pl-5 pr-8 pb-4"
        style={{ backgroundColor: HEADER_BG, paddingTop: insets.top + 8 }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-11 h-11 rounded-full bg-[#032252] border-2 border-white items-center justify-center overflow-hidden">
              {avatarUri && !imageLoadFailed ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-full h-full"
                  onError={() => setImageLoadFailed(true)}
                />
              ) : (
                <Text className="text-white text-base font-bold">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[13px] text-white/70">Hello,</Text>
              <Text
                className="text-[15px] font-semibold text-white"
                numberOfLines={1}
              >
                {firstName || 'there'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">

            <Image
              source={require('../../../../assets/images/welcome/NeatPayLogo.png')}
              className="w-[84px] h-8 mr-4"
              resizeMode="contain"
            />
           
            <TouchableOpacity
              className="w-10 h-10  rounded-full bg-white/10 items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View className="absolute top-0 right-0 bg-[#EF4444] rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        refreshControl={
          <PrimaryRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <BalanceCardCarousel
          balanceVisible={balanceVisible}
          onToggleVisibility={() => setBalanceVisible((v) => !v)}
          accountNumber={accountSummary?.account_number}
          availableBalance={accountSummary?.available_balance}
          loanBalance={accountSummary?.loan_balance}
          hasActiveLoan={hasActiveLoan}
          onMakeRepayment={() => setRepaymentOpen(true)}
        />

        {/* Services */}
        <ServicesGrid />

        {/* 1-Tap Payments Banner */}
        {/* <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl p-3.5 mx-6 mt-2">
          <MaterialCommunityIcons name="information" size={20} color="#F59E0B" />
          <Text className="flex-1 text-[13px] text-gray-700">
            You don't have any 1-tap payments set up yet.
          </Text>
        </View> */}

   
        <PromoCard />

        {accountSummary?.active_loans && accountSummary.active_loans.length > 0 && (
          <ActiveLoanCard loans={accountSummary.active_loans} />
        )}

        <RecentTransactions />
      </ScrollView>

      <RepaymentBottomSheet
        visible={repaymentOpen}
        onClose={() => setRepaymentOpen(false)}
        loan={accountSummary?.active_loans?.[0]}
        availableBalance={accountSummary?.available_balance}
      />
    </View>
  );
}
