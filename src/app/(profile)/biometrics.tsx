import { useEffect, useRef, useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export default function BiometricsScreen() {
  const storeEnabled = useAuthStore((s) => s.biometricsEnabled);
  const setEnabled = useAuthStore((s) => s.setBiometricsEnabled);

  const [displayEnabled, setDisplayEnabled] = useState(storeEnabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep the Switch in sync with the store when no toggle is in flight
  // (e.g., if the flag changes from a login sync while this screen is open).
  useEffect(() => {
    if (!pending) setDisplayEnabled(storeEnabled);
  }, [storeEnabled, pending]);

  const handleToggle = async (value: boolean) => {
    if (pending) return;
    setDisplayEnabled(value);
    setPending(true);
    setError('');
    try {
      await authService.updateBiometricsPreference(value);
      // Store update is safe to run even after unmount — it's global state.
      setEnabled(value);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setDisplayEnabled(storeEnabled);
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      if (mountedRef.current) setPending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm text-gray-700 font-medium">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Biometric Settings</Text>

      <View className="bg-[#F5F5F5] rounded-2xl px-4 py-4 flex-row items-center">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-[#1A1A1A]">Enable Biometrics</Text>
          <Text className="text-[12px] text-gray-500 mt-0.5">
            Use fingerprint or Face ID for sign-in and transactions
          </Text>
        </View>
        <Switch
          value={displayEnabled}
          onValueChange={handleToggle}
          disabled={pending}
          trackColor={{ false: '#E5E7EB', true: '#472FF8' }}
          thumbColor="#fff"
          ios_backgroundColor="#E5E7EB"
        />
      </View>

      {error ? (
        <Text className="text-[12px] text-[#EF4444] mt-3">{error}</Text>
      ) : null}
    </SafeAreaView>
  );
}
