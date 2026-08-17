import { useEffect, useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { HeaderScreen } from '@/components/ui/header-screen';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';
import { toggleNotifications } from '@/services/notification.service';
import type { AccountSummary } from '@/types/account.types';
import { BackButton } from '@/components/ui/back-button';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data: accountSummary, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  const [displayEnabled, setDisplayEnabled] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (pending) return;
    if (accountSummary) {
      setDisplayEnabled(accountSummary.is_notifications_enabled);
    }
  }, [accountSummary, pending]);

  const handleToggle = async (value: boolean) => {
    if (pending) return;
    const previous = accountSummary?.is_notifications_enabled ?? true;
    setDisplayEnabled(value);
    setPending(true);
    setError('');
    try {
      await toggleNotifications(value);
      if (!mountedRef.current) return;
      queryClient.setQueryData<AccountSummary>(
        [QUERY_KEYS.ACCOUNT_SUMMARY],
        (prev) => (prev ? { ...prev, is_notifications_enabled: value } : prev),
      );
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setDisplayEnabled(previous);
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
    } finally {
      if (mountedRef.current) setPending(false);
    }
  };

  const switchDisabled = pending || (isLoading && !accountSummary);

  return (
    <HeaderScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-6">
        <BackButton className="" />
        <Text
          className="text-[22px] font-bold text-[#032252] leading-[26px]"
          style={{ includeFontPadding: false }}
        >
          Notification settings
        </Text>
      </View>

      <View className="bg-[#F5F5F5] rounded-2xl px-4 py-4 flex-row items-center">
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-[#032252]">All notifications</Text>
          <Text className="text-[12px] text-gray-500 mt-0.5">Get notified on your activities</Text>
        </View>
        <Switch
          value={displayEnabled}
          onValueChange={handleToggle}
          disabled={switchDisabled}
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
