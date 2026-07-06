import { Text, View } from 'react-native';

import { INSUFFICIENT_FUNDS_MESSAGE } from '@/constants';

interface InsufficientFundsHintProps {
  show: boolean;
  /** Bottom-margin utility class, so callers can match each screen's spacing. */
  spacing?: string;
}

/**
 * Renders the insufficient-funds warning, or an equally-tall spacer when there's
 * nothing to warn about, so the layout doesn't jump as the message toggles.
 */
export function InsufficientFundsHint({
  show,
  spacing = 'mb-3',
}: InsufficientFundsHintProps) {
  if (!show) return <View className={spacing} />;
  return (
    <Text className={`text-xs text-[#EF4444] ${spacing}`}>
      {INSUFFICIENT_FUNDS_MESSAGE}
    </Text>
  );
}
