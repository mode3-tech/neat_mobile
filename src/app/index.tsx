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

      void SplashScreen.hideAsync();

      const store = useAuthStore.getState();
      // allSettled so a hydration error can't skip the wait (the hydrate fns
      // already swallow their own errors anyway).
      await Promise.allSettled([store.hydrateTokens(), store.hydrateBiometrics()]);

      // DEV LOGIN BYPASS — uncomment this block to land straight on the
      // Dashboard on every reload instead of the sign-in screen, reusing the
      // tokens the last real login left in SecureStore (hydrateTokens() only
      // sets the hasStoredTokens flag, it never restores them). Needs one real
      // login first. Re-comment before pushing. Pairs with the idle-logout kill
      // switch in src/hooks/use-session-timeout.ts.
      if (__DEV__) {
        const SecureStore = await import('expo-secure-store');
        const [access, refresh] = await Promise.all([
          SecureStore.getItemAsync('access_token'),
          SecureStore.getItemAsync('refresh_token'),
        ]);
        if (access && refresh) {
          // setTokens also re-attaches the access token to the axios instance.
          useAuthStore.getState().setTokens(access, refresh);
          router.replace('/Dashboard');
          return;
        }
      }

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
