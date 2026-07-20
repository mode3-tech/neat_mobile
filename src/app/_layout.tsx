import '../global.css';
import 'expo-dev-client';

import { useCallback, useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';
import 'react-native-reanimated';

import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { useAuthStore } from '@/stores/auth.store';
import { useProfileStore } from '@/stores/profile.store';
import { DeviceIntegrityGate } from '@/components/security/device-integrity-gate';
import { resolveNotificationRoute } from '@/utils/notification-route';
import {
  markNotificationHandled,
  parkDeepLink,
  reparkRecentDeepLink,
  takeDeepLink,
} from '@/utils/pending-deep-link';
import type { PushNotificationData } from '@/types/notification.types';

// Keep the native (expo-splash-screen) splash visible until the first real
// screen has painted. Called at module scope here — the earliest point that
// runs on every cold start — so it always wins the race against the OS
// auto-hiding the splash on first render. `fade` makes hideAsync() cross-fade
// into the destination instead of a hard cut. hideAsync() itself is called
// from index.tsx once the post-auth route is mounted.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 250 });

// Show notifications as alerts when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout(): React.JSX.Element {
  const router = useRouter();
  const { onTouchActivity } = useSessionTimeout(router);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    useProfileStore.getState().hydratePhotoUri();
  }, []);

  const lastResponse = Notifications.useLastNotificationResponse();

  // Single entry point for every notification tap, warm or cold.
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (!markNotificationHandled(response.notification.request.identifier)) {
        return;
      }

      const data = response.notification.request.content.data as
        | PushNotificationData
        | undefined;

      parkDeepLink(resolveNotificationRoute(data));

      // Park first, always, then check auth a macrotask later. On a foreground
      // resume this tap and use-session-timeout's AppState handler both fire
      // with no guaranteed order — deferring lets a clearAuth() land first, in
      // which case the link stays parked for the auth subscriber to replay
      // after sign-in instead of being navigated and immediately stomped.
      setTimeout(() => {
        if (!useAuthStore.getState().isAuthenticated) return;
        const target = takeDeepLink();
        if (target) router.push(target);
      }, 0);
    },
    [router],
  );

  // Warm taps: app already running in background or foreground.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );
    return () => subscription.remove();
  }, [handleNotificationResponse]);

  // Cold start: the tap that launched the app is delivered before any listener
  // mounts, so the listener above never sees it. This hook replays it.
  // clearLastNotificationResponse() is not optional — the response persists
  // across process restarts, so without it the next launch from the home-screen
  // icon would replay this same tap and navigate somewhere the user never asked
  // to go. In-process repeats (the hook re-fires on remount) are caught by
  // markNotificationHandled().
  useEffect(() => {
    if (!lastResponse) return;
    handleNotificationResponse(lastResponse);
    Notifications.clearLastNotificationResponse();
  }, [lastResponse, handleNotificationResponse]);

  // Register push token when user becomes authenticated,
  // redirect to sign-in when session is invalidated
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(async (state, prevState) => {
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        // Replay a notification tap that arrived while signed out. Taken before
        // the dynamic import below so a slow import can't delay the resume.
        //
        // The setTimeout is load-bearing: zustand subscribers run synchronously
        // inside set(), and sign-in.tsx calls router.replace('/Dashboard') on
        // the line right after setTokens(). Resuming in this tick or a
        // microtask gets stomped, silently. A macrotask lands after every
        // synchronous replace, which is also why this covers all three auth
        // exits (password, biometric, new-device) from one place. push, not
        // replace, so Dashboard stays underneath and Back works.
        const target = takeDeepLink();
        if (target) setTimeout(() => router.push(target), 0);

        const { registerForPushNotifications, sendTokenToBackend } =
          await import('@/services/notification.service');
        const token = await registerForPushNotifications();
        if (token) await sendTokenToBackend(token);
      }
      if (!state.isAuthenticated && prevState.isAuthenticated) {
        // A tap may have consumed its link moments before the session timeout
        // cleared auth — put it back so it survives the sign-in round trip.
        reparkRecentDeepLink();


        // A screen may opt out of the sign-in redirect to handle navigation
        // itself (e.g. account closure routes to /welcome). Consume the flag.
        if (state.skipLogoutRedirect) {
          useAuthStore.setState({ skipLogoutRedirect: false });
          return;
        }
        router.replace('/(sign-in)/sign-in' as any);
      }
    });
    return unsubscribe;
  }, [router]);

  // Re-register token when app returns to foreground (tokens can change)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextState) => {
        if (
          appState.current.match(/background/) &&
          nextState === 'active'
        ) {
          const isAuthenticated =
            useAuthStore.getState().isAuthenticated;
          if (!isAuthenticated) return;
          const { registerForPushNotifications, sendTokenToBackend } =
            await import('@/services/notification.service');
          const token = await registerForPushNotifications();
          if (token) await sendTokenToBackend(token);
        }
        appState.current = nextState;
      },
    );
    return () => subscription.remove();
  }, []);

  // Proactively detect device push token changes (FCM/APNs token rotation)
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(async () => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (!isAuthenticated) return;
      const { registerForPushNotifications, sendTokenToBackend, isRegistering } =
        await import('@/services/notification.service');
      if (isRegistering) return;
      const token = await registerForPushNotifications();
      if (token) await sendTokenToBackend(token);
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <ThemeProvider value={DefaultTheme}>
          <View style={{ flex: 1 }} onStartShouldSetResponderCapture={onTouchActivity}>
          <DeviceIntegrityGate>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen
              name="welcome"
              options={{ contentStyle: { backgroundColor: '#d4d8FF' } }}
            />
            <Stack.Screen name="(sign-in)" />
            <Stack.Screen
              name="Dashboard"
              options={{ animation: 'none' }}
            />
            <Stack.Screen name="(loan)" />
            <Stack.Screen name="(vas)" />
            <Stack.Screen name="(transfer)" />
            <Stack.Screen name="(savings)" />
            <Stack.Screen name="(transaction)" />
            {/* <Stack.Screen name="(account)" /> */}
            {/* <Stack.Screen name="(profile)" /> */}
            <Stack.Screen name="notifications" />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal' }}
            />
          </Stack>
          </DeviceIntegrityGate>
          </View>
          <Toaster position="top-center" richColors />
          <StatusBar style="dark" />
        </ThemeProvider>
      </KeyboardProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
