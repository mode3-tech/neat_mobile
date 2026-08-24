import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { openStoreListing } from '@/utils/store-link';
import { useOverlayNavBarStyle } from '@/components/ui/nav-bar';

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

  // The sheet paints the bottom of the screen white, so the nav bar needs dark
  // buttons — otherwise light buttons set by the screen behind (e.g. the navy
  // sign-in) go invisible against it. Restored on dismiss.
  useOverlayNavBarStyle('dark');

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
        {/* Centred, matching UpdateRequiredScreen: this is a short one-purpose
            announcement, not a form, and the two update surfaces should not
            differ in alignment. `self-center` is needed because the circle is a
            fixed-size box — items-center only centres its contents. */}
        <View
          className="self-center items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            backgroundColor: '#E8EEF7',
            marginBottom: 16,
          }}
        >
          {/* Down arrow, not up: an up arrow reads as upload/send. This prompt
              is about pulling a new version down from the store. */}
          <Ionicons name="arrow-down-circle-outline" size={32} color="#032252" />
        </View>

        <Text
          className="text-center font-bold"
          style={{ fontSize: 20, color: '#032252', marginBottom: 8 }}
        >
          Update available
        </Text>

        {/* Deliberately does NOT say "to continue" — this prompt is dismissible
            (Later, and tapping the backdrop), so blocking language would be a
            lie. That phrasing belongs on UpdateRequiredScreen. */}
        <Text
          className="text-center"
          style={{
            fontSize: 15,
            color: '#1A1A1A',
            opacity: 0.75,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          A new version of NEATPay is available with improvements and fixes.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void openStoreListing(storeUrl);
          }}
          className="items-center rounded-full bg-[#F9B700] py-4 active:opacity-70"
        >
          <Text style={{ color: '#032252', fontSize: 15, fontWeight: '600' }}>
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
              color: '#032252',
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
