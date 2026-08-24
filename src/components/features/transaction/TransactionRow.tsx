import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatNairaWhole, formatTransactionDateTime } from '@/utils/format';
import type { Transaction } from '@/types/transaction.types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface TransactionIconConfig {
  keywords: string[];
  icon: IconName;
}

// One neutral chip for every transaction type. The glyph carries the meaning,
// the colour doesn't — same treatment as ServicesGrid. The old per-type rainbow
// (purple/blue/green/orange) predates the navy palette and fought with it.
const ICON_CHIP = { bgColor: '#F1F3F8', iconColor: '#032252' };

const ICON_MAP: TransactionIconConfig[] = [
  { keywords: ['airtime'], icon: 'phone' },
  { keywords: ['transfer', 'send'], icon: 'bank-transfer' },
  { keywords: ['data'], icon: 'wifi' },
  { keywords: ['electricity'], icon: 'flash' },
  { keywords: ['cable', 'tv'], icon: 'television' },
  { keywords: ['betting'], icon: 'trophy' },
  { keywords: ['bonus', 'cashback', 'reward'], icon: 'gift' },
];

const DEFAULT_ICON: IconName = 'swap-horizontal';

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
  return { icon: match?.icon ?? DEFAULT_ICON, ...ICON_CHIP };
}

/**
 * Status colour for a *list row*, where nearly every entry is successful —
 * colouring them all green competes with the credit amount for attention. Only
 * pending and failed earn colour here. Detail screens keep the full
 * STATUS_COLORS map, where a green "Successful" is the point.
 */
export function getRowStatusColor(status: string) {
  if (status === 'successful') return '#6B7280';
  return STATUS_COLORS[status] ?? '#6B7280';
}

export function TransactionRow({
  transaction,
  onPress,
}: {
  transaction: Transaction;
  onPress?: () => void;
}) {
  const { icon, bgColor, iconColor } = getTransactionIcon(transaction.description);
  const isCredit = transaction.type === 'credit';
  const prefix = isCredit ? '+' : '-';
  const formattedAmount = formatNairaWhole(transaction.amount);
  const statusColor = getRowStatusColor(transaction.status);

  // Always a TouchableOpacity; `disabled` when there's no handler makes it inert
  // (no press feedback, no action) — equivalent to a static row, without `any`.
  return (
    <TouchableOpacity
      className="flex-row items-center py-3 px-6"
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>

      {/* Description + Date */}
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-[#032252]" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-xs text-[#6B7280] mt-0.5">
          {formatTransactionDateTime(transaction.date)}
        </Text>
      </View>

      {/* Amount + Status */}
      <View className="items-end ml-2">
        {/* Money in is green, money out is navy. Both were dark before, which
            made credit and debit read identically at a glance. */}
        <Text
          className={`text-sm font-bold ${isCredit ? 'text-[#16A34A]' : 'text-[#032252]'}`}
        >
          {prefix}{formattedAmount}
        </Text>
        <Text className="text-xs mt-0.5 capitalize" style={{ color: statusColor }}>
          {transaction.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
