import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export default function CloseAccountSuccessScreen() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setSkipLogoutRedirect = useAuthStore((s) => s.setSkipLogoutRedirect);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  useEffect(() => {
    // The account is closed and its sessions revoked server-side. Wipe all
    // local state (query cache, in-memory auth, cached photo/PIN) and delete the
    // stored tokens so the app opens on /welcome next launch, not sign-in.
    // Opt out of the global sign-in redirect first — clearAuth() flips
    // isAuthenticated, which would otherwise bounce us to /(sign-in) and skip
    // this screen; we navigate to /welcome ourselves below.
    setSkipLogoutRedirect(true);
    queryClient.clear();
    clearAuth();
    authService.clearLocalSession();

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 3000);
    return () => clearTimeout(timer);
  }, [queryClient, clearAuth, setSkipLogoutRedirect]);

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{ transform: [{ scale }] }}
          className="w-28 h-28 rounded-full bg-[#ECFDF5] items-center justify-center mb-8"
        >
          <View className="w-20 h-20 rounded-full bg-[#16A34A] items-center justify-center">
            <Ionicons name="checkmark" size={44} color="#fff" />
          </View>
        </Animated.View>

        <Animated.Text
          style={{ opacity }}
          className="text-[22px] font-bold text-[#1A1A1A] text-center mb-3"
        >
          Account Closed
        </Animated.Text>
        <Animated.Text
          style={{ opacity }}
          className="text-[14px] text-gray-500 text-center leading-[22px] px-4"
        >
          Your NEATPay account has been closed. We&rsquo;re sorry to see you go.
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}
