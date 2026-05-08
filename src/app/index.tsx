import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';

SplashScreen.preventAutoHideAsync();

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
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#472FF8' }} />;
}
