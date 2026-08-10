import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCapExpiry, formatNairaShort } from '@/utils/format';
import type { AccountLimits } from '@/types/account.types';
import { colors } from '@/theme/palette';

interface ActivationCapBannerProps {
  limits?: AccountLimits;
}

/**
 * Disclosure banner shown during the CBN 24-hour activation cap window.
 * Renders nothing unless the backend reports the cap as active.
 */
export function ActivationCapBanner({ limits }: ActivationCapBannerProps) {
  const cap = limits?.activation_cap;
  if (!cap?.active) return null;

  const capLabel =
    cap.cap_amount != null ? formatNairaShort(cap.cap_amount) : 'a daily';
  const remaining = limits?.out_flow?.remaining;

  const detail = [
    cap.expires_at ? `Expires ${formatCapExpiry(cap.expires_at)}` : null,
    remaining != null ? `${formatNairaShort(remaining)} remaining` : null,
  ]
    .filter(Boolean)
    .join('  •  ');

  return (
    <View className="bg-primary-surface border border-primary/30 rounded-[14px] p-4 mb-6 flex-row">
      <MaterialCommunityIcons
        name="information-outline"
        size={18}
        color={colors.primary}
        style={{ marginTop: 1 }}
      />
      <View className="flex-1 ml-2">
        <Text className="text-[13px] font-semibold text-primary leading-5">
          {capLabel} limit during your first 24 hours
        </Text>
        {detail !== '' && (
          <Text className="text-[12px] text-primary mt-0.5 leading-5">
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}
