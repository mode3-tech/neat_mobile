import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';

// preventAutoHideAsync()/setOptions() now live in _layout.tsx so they run at
// the earliest possible point and always win the auto-hide race.

export default function Index(): React.JSX.Element {
  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        const store = useAuthStore.getState();
        await Promise.all([
          store.hydrateTokens(),
          store.hydrateBiometrics(),
        ]);
      } catch {
        // Hydration errors are already caught inside hydrateTokens
      } finally {
        const { isAuthenticated, hasStoredTokens } = useAuthStore.getState();
        if (isAuthenticated) {
          router.replace('/Dashboard');
        } else if (hasStoredTokens) {
          router.replace('/(sign-in)/sign-in');
        } else {
          router.replace('/welcome');
        }
        // Wait two frames so the destination screen has mounted and laid
        // out before we lift the native splash — otherwise it reveals this
        // bare view (or a half-painted screen) for a beat. The `fade`
        // configured in _layout.tsx cross-fades over any sub-frame gap.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            void SplashScreen.hideAsync();
          });
        });
      }
    }
    prepare();
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#472FF8' }} />;
}
