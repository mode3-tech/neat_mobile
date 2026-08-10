import { useEffect } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { openStoreListing } from '@/utils/store-link';
import { colors } from '@/theme/palette';

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
            backgroundColor: colors.primarySurface,
            marginBottom: 20,
          }}
        >
          <Ionicons name="arrow-up-circle-outline" size={40} color={colors.primary} />
        </View>

        <Text
          className="text-center font-bold"
          style={{ fontSize: 22, color: colors.primary, marginBottom: 12 }}
        >
          Update required
        </Text>

        <Text
          className="text-center"
          style={{
            fontSize: 15,
            color: colors.overlay,
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
          className="items-center rounded-full bg-primary py-4 active:opacity-70"
        >
          <Text style={{ color: colors.inkInverse, fontSize: 15, fontWeight: '600' }}>
            Update Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
