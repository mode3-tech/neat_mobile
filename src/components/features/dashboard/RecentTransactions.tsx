import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { transactionService } from '@/services/transaction.service';
import { formatNairaWhole, formatTransactionDate } from '@/utils/format';
import { getTransactionIcon } from '@/components/features/transaction/TransactionRow';
import { QUERY_KEYS } from '@/constants';
import type { Transaction } from '@/types/transaction.types';

function RecentTransactionRow({ transaction }: { transaction: Transaction }) {
  const { icon, bgColor, iconColor } = getTransactionIcon(transaction.description);
  const isCredit = transaction.type === 'credit';
  const prefix = isCredit ? '+' : '-';
  const formattedAmount = formatNairaWhole(transaction.amount);

  return (
    <View className="flex-row items-center py-3">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {formatTransactionDate(transaction.date)}
        </Text>
      </View>
      <View className="items-end ml-2">
        <Text
          className={`text-sm font-bold ${isCredit ? 'text-[#472FF8]' : 'text-gray-900'}`}
        >
          {prefix}{formattedAmount}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5 capitalize">
          {transaction.status}
        </Text>
      </View>
    </View>
  );
}

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.RECENT_TRANSACTIONS],
    queryFn: transactionService.getRecent,
  });

  const hasTransactions = transactions && transactions.length > 0;

  return (
    <View className="mt-2 px-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-semibold text-gray-900">Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.navigate('/Dashboard/(tabs)/transaction' as any)}>
          <Text className="text-[13px] font-semibold text-[#472FF8]">View All</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="items-center py-8">
          <ActivityIndicator size="small" color="#472FF8" />
        </View>
      )}

      {!isLoading && hasTransactions && (
        <View>
          {transactions.map((tx) => (
            <RecentTransactionRow key={tx.id} transaction={tx} />
          ))}
        </View>
      )}

      {!isLoading && !hasTransactions && (
        <View className="items-center pt-6">
          <Image
            source={require('../../../../assets/images/dashboard/phone.png')}
            className="w-[240px] h-[240px]"
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}
