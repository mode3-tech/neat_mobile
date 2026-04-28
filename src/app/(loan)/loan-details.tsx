import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { loanService } from '@/services/loan.service';
import { QUERY_KEYS } from '@/constants';
import { formatNairaWhole, formatDateLong } from '@/utils/format';
import type { LoanHistoryItem, LoanHistoryStatus } from '@/types/loan.types';

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-sm text-white/80">{label}</Text>
      <Text className="text-sm font-semibold text-white">{value}</Text>
    </View>
  );
}

function ScheduleRow({ item }: { item: LoanHistoryItem }) {
  const isUpcoming = item.status === 'upcoming';
  return (
    <View
      className={`flex-row items-center rounded-2xl px-4 py-4 mb-3 ${
        isUpcoming ? 'bg-[#FEF3E2]' : 'bg-[#F9FAFB]'
      }`}
    >
      <View className="w-9 h-9 rounded-lg bg-[#EEF0FF] items-center justify-center mr-3">
        <MaterialCommunityIcons name="package-variant" size={18} color="#472FF8" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-[#6B7280] mb-1">Loan Amount</Text>
        <Text className="text-sm font-semibold text-[#1A1A1A]">
          {formatDateLong(item.payment_date)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-[15px] font-bold text-[#1A1A1A]">
          {formatNairaWhole(item.loan_amount)}
        </Text>
        <Text className={`text-xs ${statusColorClass(item.status)}`}>
          {statusLabel(item.status)}
        </Text>
      </View>
    </View>
  );
}

export default function LoanDetailsScreen() {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();

  const {
    data: details,
    isLoading: loadingDetails,
    isError: detailsError,
  } = useQuery({
    queryKey: [QUERY_KEYS.LOAN_DETAILS, loanId],
    queryFn: () => loanService.getLoanDetails(loanId!),
    enabled: !!loanId,
  });

  const {
    data: schedule,
    isLoading: loadingSchedule,
  } = useQuery({
    queryKey: [QUERY_KEYS.LOAN_HISTORY_BY_ID, loanId],
    queryFn: () => loanService.getLoanHistoryById(loanId!),
    enabled: !!loanId,
  });

  const isLoading = loadingDetails || loadingSchedule;

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-5">Loan Details</Text>

        {isLoading && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="small" color="#472FF8" />
          </View>
        )}

        {!isLoading && (!loanId || detailsError || !details) && (
          <View className="py-20 items-center justify-center px-6">
            <MaterialCommunityIcons
              name={!loanId ? 'file-document-outline' : 'alert-circle-outline'}
              size={64}
              color="#E5E7EB"
            />
            <Text className="text-base font-semibold text-[#1A1A1A] mt-3">
              {!loanId ? 'No loan selected' : "Couldn't load loan details"}
            </Text>
            <Text className="text-[13px] text-[#6B7280] mt-1 text-center">
              {!loanId
                ? 'Please choose a loan from the history list.'
                : 'Please check your connection and try again.'}
            </Text>
          </View>
        )}

        {!isLoading && details && (
          <>
            <View className="bg-[#472FF8] rounded-2xl p-5 mb-6 overflow-hidden">
              <View className="flex-row items-start">
                <View className="flex-1">
                  <SummaryRow
                    label="Total loan amount"
                    value={formatNairaWhole(details.total_loan_amount)}
                  />
                  <SummaryRow
                    label="Amount repaid"
                    value={formatNairaWhole(details.amount_repaid)}
                  />
                  <SummaryRow
                    label="Outstanding balance"
                    value={formatNairaWhole(details.outstanding_balance)}
                  />
                  <SummaryRow
                    label="Due date"
                    value={formatDateLong(details.due_date)}
                  />
                </View>
                <Image
                  source={require('../../../assets/images/pig.png')}
                  className="w-[80px] h-[80px] opacity-30"
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text className="text-base font-bold text-[#1A1A1A] mt-2 mb-4">
              Payment Schedule
            </Text>

            {(schedule ?? []).length === 0 ? (
              <View className="py-10 items-center justify-center">
                <Text className="text-sm text-[#6B7280]">No payment records yet.</Text>
              </View>
            ) : (
              (schedule ?? []).map((item, idx) => (
                <ScheduleRow
                  key={`${item.loan_id}-${item.payment_date}-${idx}`}
                  item={item}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
