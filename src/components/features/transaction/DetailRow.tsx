import { Text, View } from 'react-native';

/**
 * A label/value row used by the transaction details, transaction receipt, and
 * transfer receipt screens. `valueColor` tints the value (e.g. status colour);
 * `isLast` drops the bottom divider on the final row.
 */
export function DetailRow({
  label,
  value,
  valueColor,
  isLast,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}): React.JSX.Element {
  return (
    <View
      className={`flex-row justify-between items-start gap-4 py-[14px] ${
        !isLast ? 'border-b border-[#F3F4F6]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280] shrink-0">{label}</Text>
      <Text
        className="text-sm font-semibold flex-1 text-right"
        style={{ color: valueColor ?? '#1A1A1A' }}
      >
        {value}
      </Text>
    </View>
  );
}
