import { useEffect } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { openStoreListing } from '@/utils/store-link';
import { useOverlayNavBarStyle } from '@/components/ui/nav-bar';

type Props = {
  /** Optional `store_url` from GET /app/version. */
  storeUrl?: string;
};

/**
 * Hard block, presented as a non-dismissible sheet over the live app so the
 * screen behind keeps animating.
 *
 * "Blocked" has to be literal, not visual. Three things enforce it:
 *  - the overlay fills the screen, so every touch lands on it, never on the app
 *  - there is no Later button and the backdrop does not dismiss
 *  - the Android hardware back button is captured (see below)
 *
 * Nothing here can set state that lets the user through — the gate re-renders
 * this for as long as the backend says the build is dead.
 */
export function UpdateRequiredScreen({ storeUrl }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // White sheet over the bottom of the screen — same reason as the soft sheet:
  // light nav-bar buttons from the screen behind would vanish against it.
  useOverlayNavBarStyle('dark');

  // Returning true marks the press handled, so neither the navigator nor the
  // OS acts on it — without this, back would pop the stack underneath a block
  // the user is supposed to be stuck behind.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, []);

  return (
    <View
      className="absolute inset-0 justify-end"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      {/* Deliberately NOT a Pressable: tapping the backdrop must do nothing.
          As a plain View it still swallows the touch, so the app behind stays
          untouchable. */}
      <View className="flex-1" />

      <View
        className="bg-white"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View
          className="items-center justify-center self-center rounded-full"
          style={{
            width: 80,
            height: 80,
            backgroundColor: '#E8EEF7',
            marginBottom: 20,
          }}
        >
          {/* Down arrow, not up — matches UpdateAvailableSheet; an up arrow
              reads as upload/send rather than "get the new version". */}
          <Ionicons name="arrow-down-circle-outline" size={40} color="#032252" />
        </View>

        <Text
          className="text-center font-bold"
          style={{ fontSize: 22, color: '#032252', marginBottom: 12 }}
        >
          Update required
        </Text>

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
          {/* "to continue" is accurate HERE — this screen is a total block with
              no dismiss. The soft sheet deliberately avoids that phrasing. */}
          A new version of NEATPay is required to continue. Please update to the
          latest version.
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
      </View>
    </View>
  );
}
