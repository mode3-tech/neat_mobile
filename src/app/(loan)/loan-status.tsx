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
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { loanService } from '@/services/loan.service';
import { QUERY_KEYS } from '@/constants';
import { formatNairaWhole } from '@/utils/format';
import type { LoanStatusItem } from '@/types/loan.types';

function StatTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  // footer: string;
}) {
  return (
    <View className="flex-1 bg-[#472FF8] rounded-2xl p-5">
      <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-6">
        <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text className="text-xs text-white/80 mb-1.5">{label}</Text>
      <Text className="text-[17px] font-bold text-white">{value}</Text>
      {/* <Text className="text-[11px] text-white/70 mt-2">{footer}</Text> */}
    </View>
  );
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between py-4 ${
        isLast ? '' : 'border-b border-[#D9DCF4]'
      }`}
    >
      <Text className="text-sm text-[#6B7280]">{label}</Text>
      <Text className="text-sm font-semibold text-[#1A1A1A]">{value}</Text>
    </View>
  );
}

function LoanStatusCard({ loan }: { loan: LoanStatusItem }) {
  // const paidPct =
  //   loan.loan_amount > 0
  //     ? Math.max(
  //         0,
  //         Math.min(
  //           100,
  //           Math.round(
  //             ((loan.loan_amount - loan.balance_remaining) / loan.loan_amount) *
  //               100,
  //           ),
  //         ),
  //       )
  //     : 0;
  // const remainingPct = 100 - paidPct;

  return (
    <View className="border border-[#E5E7EB] rounded-2xl p-6 mb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-[16px] font-semibold text-[#1A1A1A]">
            Active Loan
          </Text>
          <Text className="text-xs text-[#6B7280] mt-1">
            ID: {loan.loan_id}
          </Text>
        </View>
        <View className="bg-[#D1FAE5] rounded-full px-3 py-1">
          <Text className="text-[#16A34A] text-xs font-semibold">
            {loan.status}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mt-5">
        <StatTile
          icon="wallet-outline"
          label="Loan Amount"
          value={formatNairaWhole(loan.loan_amount)}
          // footer={`${paidPct}% Paid`}
        />
        <StatTile
          icon="wallet-outline"
          label="Balance Remaining"
          value={formatNairaWhole(loan.balance_remaining)}
          // footer={`${remainingPct}% remaining`}
        />
      </View>

      <View className="bg-[#EEF0FF] rounded-2xl px-5 py-2 mt-5">
        <DetailRow
          label="Monthly Payment"
          value={formatNairaWhole(loan.periodic_payment)}
        />
        <DetailRow label="Tenure" value={loan.tenure} />
        <DetailRow
          label="Interest Rate"
          value={`${loan.interest_rate}%`}
          isLast
        />
      </View>
    </View>
  );
}

export default function LoanStatusScreen() {
  const { data: loans, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.LOAN_STATUS],
    queryFn: loanService.getAllLoans,
  });

  const isEmpty = !isLoading && !isError && (!loans || loans.length === 0);

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-5">
        Loan Status
      </Text>

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
            Could not load loan status.{'\n'}Please try again.
          </Text>
        </View>
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center py-16">
          <Image
            source={require('../../../assets/images/loan-status.png')}
            className="w-[280px] h-[280px]"
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {(loans ?? []).map((loan) => (
            <LoanStatusCard key={loan.loan_id} loan={loan} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
