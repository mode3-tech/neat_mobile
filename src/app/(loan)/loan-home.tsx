import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { loanService } from '@/services/loan.service';
import { accountService } from '@/services/account.service';
import { QUERY_KEYS } from '@/constants';
import { formatNairaWhole, formatDateSlash } from '@/utils/format';
import type { ActiveLoan } from '@/types/loan.types';

interface ActionItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

function ActionItem({ icon, label, onPress, disabled }: ActionItemProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between rounded-[14px] px-4 py-[18px] ${
        disabled ? 'bg-[#F3F4F6]' : 'bg-[#F9FAFB]'
      }`}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View className="flex-row items-center gap-[14px]">
        <Text className={`text-xl ${disabled ? 'opacity-40' : ''}`}>{icon}</Text>
        <Text
          className={`text-[15px] font-medium ${
            disabled ? 'text-[#9CA3AF]' : 'text-[#1A1A1A]'
          }`}
        >
          {label}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={disabled ? '#D1D5DB' : '#472FF8'}
      />
    </TouchableOpacity>
  );
}

function EmptyBalanceCard() {
  return (
    <View className="bg-[#472FF8] rounded-2xl p-6 mb-7 flex-row items-center justify-between">
      <View>
        <Text className="text-sm text-white/80 mb-2">Outstanding Balance</Text>
        <Text className="text-[28px] font-bold text-white">₦ 0.00</Text>
      </View>
      <Image
        source={require('../../../assets/images/pig.png')}
        className="w-[100px] h-[100px]"
        resizeMode="contain"
      />
    </View>
  );
}

function ActiveBalanceCard({ loan }: { loan: ActiveLoan }) {
  return (
    <View className="bg-[#472FF8] rounded-2xl p-6 mb-7">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm text-white/80 mb-2">Outstanding Balance</Text>
          <Text className="text-[28px] font-bold text-white">
            {formatNairaWhole(loan.outstanding_balance)}
          </Text>
        </View>
        <Image
          source={require('../../../assets/images/pig.png')}
          className="w-[80px] h-[80px]"
          resizeMode="contain"
        />
      </View>

      <View className="flex-row mt-5 mb-5">
        <View className="flex-1">
          <Text className="text-xs text-white/80 mb-1">Next Payment</Text>
          <Text className="text-sm font-semibold text-white">
            {formatNairaWhole(loan.next_payment)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-white/80 mb-1">Due Date</Text>
          <Text className="text-sm font-semibold text-white">
            {formatDateSlash(loan.due_date)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="bg-white rounded-full py-3.5 items-center"
        activeOpacity={0.8}
        onPress={() => {}}
      >
        <Text className="text-[15px] font-semibold text-[#472FF8]">Make Repayment</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LoanHomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: loanService.getActiveLoans,
  });

  const { data: accountSummary } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  const loan = data?.[0];
  const hasLoan = !!loan;
  const activeLoanId = accountSummary?.active_loans?.[0]?.loan_id;

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1">Loans</Text>
      <Text className="text-[13px] text-[#6B7280] mb-5">Manage your loans and applications</Text>

      {isLoading ? (
        <View className="h-[180px] items-center justify-center mb-7">
          <ActivityIndicator size="small" color="#472FF8" />
        </View>
      ) : hasLoan ? (
        <ActiveBalanceCard loan={loan} />
      ) : (
        <EmptyBalanceCard />
      )}

      <View className="gap-3">
        <ActionItem
          icon="📋"
          label="Apply New Loan"
          onPress={() => router.push('/(loan)/loan-eligibility')}
        />
        <ActionItem
          icon="📅"
          label="Repayment Schedule"
          disabled={!activeLoanId}
          onPress={() => {
            if (!activeLoanId) return;
            router.push({
              pathname: '/(loan)/repayment-schedule',
              params: { loanId: activeLoanId },
            });
          }}
        />
        <ActionItem
          icon="📊"
          label="Loan Status"
          onPress={() => router.push('/(loan)/loan-status')}
        />
        <ActionItem
          icon="💰"
          label="Loan History"
          onPress={() => router.push('/(loan)/loan-history')}
        />
      </View>
    </SafeAreaView>
  );
}
