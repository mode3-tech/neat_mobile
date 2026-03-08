import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { SplashScreenComponent } from '@/components/ui/splash-screen';

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_DURATION = 2500;

export default function Index(): React.JSX.Element {
  useEffect(() => {
    async function prepare(): Promise<void> {
      const startTime = Date.now();
      try {
        // Load fonts, resources, or prefetch data here
      } catch (_e) {
        // handle startup errors
      } finally {
        await SplashScreen.hideAsync();
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed);
        setTimeout(() => router.replace('/welcome'), remaining);
      }
    }
    prepare();
  }, []);

  return <SplashScreenComponent />;
}
