import { useState, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';
import DashboardHeader from '@/components/features/dashboard/DashboardHeader';
import BalanceCardCarousel from '@/components/features/dashboard/BalanceCardCarousel';
import ServicesGrid from '@/components/features/dashboard/ServicesGrid';
import PromoCard from '@/components/features/dashboard/PromoCard';
import RecentTransactions from '@/components/features/dashboard/RecentTransactions';
import ActiveLoanCard from '@/components/features/dashboard/ActiveLoanCard';
import RepaymentBottomSheet from '@/components/features/loans/RepaymentBottomSheet';
import { PrimaryRefreshControl } from '@/components/ui/refresh-control';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repaymentOpen, setRepaymentOpen] = useState(false);

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

  const { data: accountSummary } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  const hasActiveLoan = (accountSummary?.active_loans?.length ?? 0) > 0;

  return (
    <View className="flex-1 bg-white">
      {/* Pinned — stays fixed above the scrolling content. Drop this line to
          exclude the header from a screen. */}
      <DashboardHeader />

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
