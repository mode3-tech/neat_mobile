import { useState, useEffect, useCallback } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { getUnreadCount } from '@/services/notification.service';
import { accountService } from '@/services/account.service';
import BalanceCardCarousel from '@/components/features/dashboard/BalanceCardCarousel';
import ServicesGrid from '@/components/features/dashboard/ServicesGrid';
import PromoCard from '@/components/features/dashboard/PromoCard';
import RecentTransactions from '@/components/features/dashboard/RecentTransactions';
import ActiveLoanCard from '@/components/features/dashboard/ActiveLoanCard';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['unread-count'] }),
        queryClient.invalidateQueries({ queryKey: ['account-summary'] }),
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

  const { data: accountSummary } = useQuery({
    queryKey: ['account-summary'],
    queryFn: accountService.getSummary,
  });

  useEffect(() => {
    if (fetchedCount !== undefined) setUnreadCount(fetchedCount);
  }, [fetchedCount, setUnreadCount]);

  const firstName = accountSummary?.full_name?.split(' ')[0] ?? user?.firstName ?? 'MJ';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-2 pb-1">
          <View className="flex-row items-center gap-2.5">
            <View className="w-12 h-12 rounded-full bg-[#472FF8] items-center justify-center">
              <Text className="text-white text-base font-bold">{initial}</Text>
            </View>
            <View>
              {/* <Text className="text-xs font-normal text-gray-500">Welcome Back,</Text> */}
              <Text className="text-base font-bold text-gray-900">Hi, {firstName} 👋</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-[#EF4444] rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Image
              source={require('../../../../assets/images/dashboard/logoe.png')}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </View>
        </View>

      
        <BalanceCardCarousel
          balanceVisible={balanceVisible}
          onToggleVisibility={() => setBalanceVisible((v) => !v)}
          accountNumber={accountSummary?.account_number}
          availableBalance={accountSummary?.available_balance}
          loanBalance={accountSummary?.loan_balance}
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
    </SafeAreaView>
  );
}
