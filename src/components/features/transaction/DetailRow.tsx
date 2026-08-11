import { Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

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
  const handleCopy = () => {
    Clipboard.setStringAsync(copyValue!);
    toast.success('Copied');
  };

  return (
    <View
      className={`flex-row justify-between items-start gap-4 py-[14px] ${
        !isLast ? 'border-b border-line-subtle' : ''
      }`}
    >
      <Text className="text-[13px] text-ink-soft shrink-0">{label}</Text>
      {copyValue ? (
        <View className="flex-row items-center justify-end gap-2 flex-1">
          <Text
            className="text-sm font-semibold text-right shrink"
            style={{ color: valueColor ?? colors.ink }}
          >
            {value}
          </Text>
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="copy"
              size={16}
              color={colors.inkMuted}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <Text
          className="text-sm font-semibold flex-1 text-right"
          style={{ color: valueColor ?? colors.ink }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}
