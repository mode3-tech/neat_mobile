import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { colors } from '@/theme/palette';

/**
 * App-wide connectivity banner. Pinned to the top and shown for the whole time
 * the device is offline; renders nothing when online. Mounted once at the root
 * (see `src/app/_layout.tsx`) so it overlays every screen.
 */
export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View
      className="absolute left-0 right-0 top-0 z-50 bg-danger-surface border-b border-danger/30 px-4 pb-3 flex-row"
      style={{ paddingTop: insets.top + 8 }}
    >
      <MaterialCommunityIcons
        name="wifi-off"
        size={18}
        color={colors.danger}
        style={{ marginTop: 1 }}
      />
      <View className="flex-1 ml-2">
        <Text className="text-[13px] font-semibold text-danger leading-5">
          No internet connection
        </Text>
        <Text className="text-[12px] text-danger mt-0.5 leading-5">
          Some actions are unavailable until you reconnect.
        </Text>
      </View>
    </View>
  );
}
