import '../global.css';
import 'expo-dev-client';

import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { useAuthStore } from '@/stores/auth.store';
import type { NotificationData } from '@/types/notification.types';

// Show notifications as alerts when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

  // Navigate to the correct screen when user taps a notification
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content
          .data as NotificationData;
        if (data?.screen) {
          let params: Record<string, string> | undefined;
          try {
            params = data.params ? JSON.parse(data.params) : undefined;
          } catch {
            // Malformed params from backend — navigate without them
          }
          router.push({ pathname: data.screen as any, params });
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  // Register push token when user becomes authenticated
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(async (state, prevState) => {
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        const { registerForPushNotifications, sendTokenToBackend } =
          await import('@/services/notification.service');
        const token = await registerForPushNotifications();
        if (token) await sendTokenToBackend(token);
      }
    });
    return unsubscribe;
  }, []);

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

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <ThemeProvider value={DefaultTheme}>
          <View style={{ flex: 1 }} onStartShouldSetResponderCapture={onTouchActivity}>
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
            <Stack.Screen name="(transfer)" />
            <Stack.Screen name="notifications" />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal' }}
            />
          </Stack>
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
