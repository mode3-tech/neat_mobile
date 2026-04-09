import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { SplashScreenComponent } from '@/components/ui/splash-screen';
import { useAuthStore } from '@/stores/auth.store';

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_DURATION = 2500;

function minDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Index(): React.JSX.Element {
  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        const store = useAuthStore.getState();
        await Promise.all([
          store.hydrateTokens(),
          store.hydrateBiometrics(),
          minDelay(SPLASH_MIN_DURATION),
        ]);
      } catch {
        // Hydration errors are already caught inside hydrateTokens
      } finally {
        await SplashScreen.hideAsync();
        const { isAuthenticated, hasStoredTokens } = useAuthStore.getState();
        if (isAuthenticated) {
          router.replace('/Dashboard');
        } else if (hasStoredTokens) {
          router.replace('/(sign-in)/sign-in');
        } else {
          router.replace('/welcome');
        }
      }
    }
    prepare();
  }, []);

  return <SplashScreenComponent />;
}
