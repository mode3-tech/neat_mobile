import { useEffect, useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { HeaderScreen } from '@/components/ui/header-screen';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { BackButton } from '@/components/ui/back-button';

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
    <HeaderScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-6">
        <BackButton className="" />
        <Text
          className="text-[22px] font-bold text-[#032252] leading-[26px]"
          style={{ includeFontPadding: false }}
        >
          Biometric Settings
        </Text>
      </View>

      <View className="bg-[#F5F5F5] rounded-2xl px-4 py-4 flex-row items-center">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-[#032252]">Enable Biometrics</Text>
          <Text className="text-[12px] text-gray-500 mt-0.5">
            Use fingerprint or Face ID for sign-in and transactions
          </Text>
        </View>
        <Switch
          value={displayEnabled}
          onValueChange={handleToggle}
          disabled={pending}
          trackColor={{ false: '#E5E7EB', true: '#032252' }}
          thumbColor="#fff"
          ios_backgroundColor="#E5E7EB"
        />
      </View>

      {error ? (
        <Text className="text-[12px] text-[#EF4444] mt-3">{error}</Text>
      ) : null}
    </HeaderScreen>
  );
}
