import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CopyButton } from '@/components/ui/copy-button';

/**
 * A label/value row used by the transaction details, transaction receipt, and
 * transfer receipt screens. `valueColor` tints the value (e.g. status colour);
 * `isLast` drops the bottom divider on the final row. When `copyValue` is set,
 * a copy-to-clipboard button is rendered beside the value.
 */
export function DetailRow({
  label,
  value,
  valueColor,
  isLast,
  copyValue,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
  copyValue?: string;
}): React.JSX.Element {
  return (
    <View
      className={`flex-row justify-between items-start gap-4 py-[14px] ${
        !isLast ? 'border-b border-[#EEF1F6]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280] shrink-0">{label}</Text>
      {copyValue ? (
        <View className="flex-row items-center justify-end gap-2 flex-1">
          <Text
            className="text-sm font-semibold text-right shrink"
            style={{ color: valueColor ?? '#032252' }}
          >
            {value}
          </Text>
          <CopyButton
            value={copyValue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={16}
              color="#032252"
            />
          </CopyButton>
        </View>
      ) : (
        <Text
          className="text-sm font-semibold flex-1 text-right"
          style={{ color: valueColor ?? '#032252' }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}
