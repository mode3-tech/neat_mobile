import { Text, TouchableOpacity, View } from 'react-native';

import { formatNairaWhole, formatTransactionDateTime } from '@/utils/format';
import type { Transaction } from '@/types/transaction.types';
import { Icon, type IconName } from '@/theme/icons';
import { accents, colors } from '@/theme/palette';

interface TransactionIconConfig {
  keywords: string[];
  icon: IconName;
  bgColor: string;
  iconColor: string;
}

const ICON_MAP: TransactionIconConfig[] = [
  { keywords: ['airtime'], icon: 'tabSupport', bgColor: accents.airtime.surface, iconColor: accents.airtime.icon },
  { keywords: ['transfer', 'send'], icon: 'transfer', bgColor: accents.transfer.surface, iconColor: accents.transfer.icon },
  { keywords: ['data'], icon: 'data', bgColor: accents.data.surface, iconColor: accents.data.icon },
  { keywords: ['electricity'], icon: 'electricity', bgColor: accents.electricity.surface, iconColor: accents.electricity.icon },
  { keywords: ['cable', 'tv'], icon: 'cableTv', bgColor: accents.cable.surface, iconColor: accents.cable.icon },
  { keywords: ['betting'], icon: 'betting', bgColor: accents.betting.surface, iconColor: accents.betting.icon },
  { keywords: ['bonus', 'cashback', 'reward'], icon: 'reward', bgColor: accents.reward.surface, iconColor: accents.reward.icon },
];

const DEFAULT_ICON: Omit<TransactionIconConfig, 'keywords'> = {
  icon: 'swap',
  bgColor: accents.fallback.surface,
  iconColor: accents.fallback.icon,
};

export const STATUS_COLORS: Record<string, string> = {
  successful: colors.success,
  pending: colors.warning,
  failed: colors.danger,
};

export function getTransactionIcon(description: string) {
  const lower = description.toLowerCase();
  const match = ICON_MAP.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw)),
  );
  return match ?? DEFAULT_ICON;
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
  const statusColor = STATUS_COLORS[transaction.status] ?? colors.inkSoft;

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
        <Icon name={icon} size={20} color={iconColor} />
      </View>

      {/* Description + Date */}
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-xs text-ink-soft mt-0.5">
          {formatTransactionDateTime(transaction.date)}
        </Text>
      </View>

      {/* Amount + Status */}
      <View className="items-end ml-2">
        <Text
          className={`text-sm font-bold ${isCredit ? 'text-primary' : 'text-ink'}`}
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
