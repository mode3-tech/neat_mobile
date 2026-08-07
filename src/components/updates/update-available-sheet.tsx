import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { openStoreListing } from '@/utils/store-link';

type Props = {
  /** Optional `store_url` from GET /app/version. */
  storeUrl?: string;
  onDismiss: () => void;
};

/**
 * Soft prompt. Sits over the live app, which stays usable behind it.
 *
 * Rendered as an absolutely-positioned overlay rather than an RN <Modal> — a
 * Modal at the navigator root interacts badly with react-native-gesture-handler
 * and would sit outside the GestureHandlerRootView's tree.
 */
export function UpdateAvailableSheet({
  storeUrl,
  onDismiss,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute inset-0 justify-end"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      {/* Tapping the backdrop is the same as "Later". */}
      <Pressable
        className="flex-1"
        accessibilityRole="button"
        accessibilityLabel="Dismiss update prompt"
        onPress={onDismiss}
      />

      <View
        className="bg-white"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            backgroundColor: '#EEF0FF',
            marginBottom: 16,
          }}
        >
          <Ionicons name="arrow-up-circle-outline" size={32} color="#472FF8" />
        </View>

        <Text
          className="font-bold"
          style={{ fontSize: 20, color: '#472FF8', marginBottom: 8 }}
        >
          Update available
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: '#000000',
            opacity: 0.75,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          A new version of the app is available. Download the latest version to
          continue.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void openStoreListing(storeUrl);
          }}
          className="items-center rounded-full bg-[#472FF8] py-4 active:opacity-70"
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
            Update Now
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          className="mt-2 items-center py-3.5 active:opacity-70"
        >
          <Text
            style={{
              color: '#000000',
              opacity: 0.6,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            Later
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
