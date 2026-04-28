import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { loanService } from '@/services/loan.service';
import { QUERY_KEYS } from '@/constants';
import { formatNairaWhole, formatDateLong } from '@/utils/format';
import type { LoanHistoryItem, LoanHistoryStatus } from '@/types/loan.types';

type TabKey = 'all' | 'upcoming' | 'paid' | 'overdue';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Ongoing' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

function statusLabel(status: LoanHistoryStatus): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'upcoming':
      return 'Pending';
  }
}

function statusColorClass(status: LoanHistoryStatus): string {
  switch (status) {
    case 'paid':
      return 'text-[#16A34A]';
    case 'overdue':
      return 'text-[#EF4444]';
    case 'upcoming':
      return 'text-[#6B7280]';
  }
}

function HistoryRow({ item }: { item: LoanHistoryItem }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(loan)/loan-details',
          params: { loanId: item.loan_id },
        })
      }
      className="flex-row items-center justify-between bg-[#F9FAFB] rounded-2xl px-4 py-4 mb-3"
    >
      <View>
        <Text className="text-xs text-[#6B7280] mb-1">Loan Amount</Text>
        <Text className="text-sm font-semibold text-[#1A1A1A]">
          {formatDateLong(item.payment_date)}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="items-end">
          <Text className="text-[15px] font-bold text-[#1A1A1A]">
            {formatNairaWhole(item.loan_amount)}
          </Text>
          <Text className={`text-xs ${statusColorClass(item.status)}`}>
            {statusLabel(item.status)}
          </Text>
        </View>
        <View className="w-7 h-7 rounded-md bg-[#EEF0FF] items-center justify-center">
          <MaterialCommunityIcons name="chevron-right" size={18} color="#472FF8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LoanHistoryScreen() {
  const [tab, setTab] = useState<TabKey>('all');

  const {
    data: history,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [QUERY_KEYS.LOAN_HISTORY],
    queryFn: loanService.getLoanHistory,
  });

  const items =
    tab === 'all' ? history ?? [] : (history ?? []).filter((h) => h.status === tab);

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-5">Loan History</Text>

      <View className="flex-row gap-2 mb-5">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              activeOpacity={0.85}
              className={`flex-1 py-2 rounded-full border items-center ${
                active
                  ? 'bg-[#472FF8] border-[#472FF8]'
                  : 'bg-white border-[#472FF8]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-white' : 'text-[#472FF8]'
                }`}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View className="h-[180px] items-center justify-center">
          <ActivityIndicator size="small" color="#472FF8" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center py-16">
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color="#EF4444"
          />
          <Text className="text-sm text-[#6B7280] mt-3 text-center">
            Could not load loan history.{'\n'}Please try again.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center py-16">
          <MaterialCommunityIcons
            name="file-document-outline"
            size={48}
            color="#E5E7EB"
          />
          <Text className="text-sm text-[#6B7280] mt-3 text-center">
            No loans to show here yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {items.map((item, idx) => (
            <HistoryRow key={`${item.loan_id}-${item.payment_date}-${idx}`} item={item} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
