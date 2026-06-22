import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/auth.store';
import { SplashScreenComponent } from '@/components/ui/splash-screen';

// preventAutoHideAsync()/setOptions() live in _layout.tsx so they run at the
// earliest possible point and win the native auto-hide race.

export default function Index(): React.JSX.Element {
  useEffect(() => {
    async function prepare(): Promise<void> {
      // Lift the native splash right away to reveal our JS splash (same logo on
      // #472FF8, so the hand-off is seamless). The JS splash then covers the
      // hydration work below and we route the moment it's done — no artificial
      // delay on the hot startup path.
      void SplashScreen.hideAsync();

      const store = useAuthStore.getState();
      // allSettled so a hydration error can't skip the wait (the hydrate fns
      // already swallow their own errors anyway).
      await Promise.allSettled([store.hydrateTokens(), store.hydrateBiometrics()]);

      const { isAuthenticated, hasStoredTokens } = useAuthStore.getState();
      if (isAuthenticated) {
        router.replace('/Dashboard');
      } else if (hasStoredTokens) {
        router.replace('/(sign-in)/sign-in');
      } else {
        router.replace('/welcome');
      }
    }
    prepare();
  }, []);

  return <SplashScreenComponent />;
}
