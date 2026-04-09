import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatNairaWhole, formatTransactionDateTime } from '@/utils/format';
import type { Transaction } from '@/types/transaction.types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface TransactionIconConfig {
  keywords: string[];
  icon: IconName;
  bgColor: string;
  iconColor: string;
}

const ICON_MAP: TransactionIconConfig[] = [
  { keywords: ['airtime'], icon: 'phone', bgColor: '#F3F0FF', iconColor: '#472FF8' },
  { keywords: ['transfer', 'send'], icon: 'bank-transfer', bgColor: '#EBF5FF', iconColor: '#3B82F6' },
  { keywords: ['data'], icon: 'wifi', bgColor: '#ECFDF5', iconColor: '#10B981' },
  { keywords: ['electricity'], icon: 'flash', bgColor: '#FFF7ED', iconColor: '#F59E0B' },
  { keywords: ['cable', 'tv'], icon: 'television', bgColor: '#FFF1F2', iconColor: '#F97316' },
  { keywords: ['betting'], icon: 'trophy', bgColor: '#FEF2F2', iconColor: '#EF4444' },
  { keywords: ['bonus', 'cashback', 'reward'], icon: 'gift', bgColor: '#FDF2F8', iconColor: '#EC4899' },
];

const DEFAULT_ICON: Omit<TransactionIconConfig, 'keywords'> = {
  icon: 'swap-horizontal',
  bgColor: '#F3F4F6',
  iconColor: '#6B7280',
};

export const STATUS_COLORS: Record<string, string> = {
  successful: '#16A34A',
  pending: '#F59E0B',
  failed: '#EF4444',
};

export function getTransactionIcon(description: string) {
  const lower = description.toLowerCase();
  const match = ICON_MAP.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw)),
  );
  return match ?? DEFAULT_ICON;
}

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { icon, bgColor, iconColor } = getTransactionIcon(transaction.description);
  const isCredit = transaction.type === 'credit';
  const prefix = isCredit ? '+' : '-';
  const formattedAmount = formatNairaWhole(transaction.amount);
  const statusColor = STATUS_COLORS[transaction.status] ?? '#6B7280';

  return (
    <View className="flex-row items-center py-3 px-6">
      {/* Icon */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>

      {/* Description + Date */}
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {formatTransactionDateTime(transaction.date)}
        </Text>
      </View>

      {/* Amount + Status */}
      <View className="items-end ml-2">
        <Text
          className={`text-sm font-bold ${isCredit ? 'text-[#472FF8]' : 'text-gray-900'}`}
        >
          {prefix}{formattedAmount}
        </Text>
        <Text className="text-xs mt-0.5 capitalize" style={{ color: statusColor }}>
          {transaction.status}
        </Text>
      </View>
    </View>
  );
}
