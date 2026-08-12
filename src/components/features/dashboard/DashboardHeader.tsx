import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { useProfileStore } from '@/stores/profile.store';
import { getUnreadCount } from '@/services/notification.service';
import { accountService } from '@/services/account.service';

const HEADER_BG = '#032252';

/**
 * The navy app header: avatar, greeting, logo, notification bell.
 *
 * Opt-in by design — a screen gets this header only by rendering it. There is
 * no global mount to fight with, so "exclude it from this screen" just means
 * not rendering it here.
 *
 * It fetches its own data rather than taking props. Both queries reuse the keys
 * the rest of the dashboard already uses, so TanStack serves them from cache
 * and no extra network request happens when the host screen loads the same
 * data. That is what keeps it a zero-prop drop-in.
 */
export default function DashboardHeader() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const user = useAuthStore((s) => s.user);
  const photoUri = useProfileStore((s) => s.photoUri);
  const photoCacheBuster = useProfileStore((s) => s.photoCacheBuster);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { data: fetchedCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
  });

  const { data: accountSummary, dataUpdatedAt: summaryUpdatedAt } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  useEffect(() => {
    if (fetchedCount !== undefined) setUnreadCount(fetchedCount);
  }, [fetchedCount, setUnreadCount]);

  const fullName = accountSummary?.full_name ?? user?.firstName ?? '';
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? '';
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0]!.charAt(0)}${nameParts[nameParts.length - 1]!.charAt(0)}`.toUpperCase()
      : firstName.charAt(0).toUpperCase() || 'U';

  const rawAvatarUri: string | null = accountSummary?.profile_picture || photoUri || null;
  const avatarUri = (() => {
    if (!rawAvatarUri) return null;
    if (!/^https?:\/\//.test(rawAvatarUri) || photoCacheBuster === 0) {
      return rawAvatarUri;
    }
    const sep = rawAvatarUri.includes('?') ? '&' : '?';
    return `${rawAvatarUri}${sep}v=${photoCacheBuster}`;
  })();

  useEffect(() => {
    setImageLoadFailed(false);
  }, [avatarUri, summaryUpdatedAt]);

  return (
    <>
      {/* The header is dark, so the status bar icons need to be white while the
          host screen is focused. Two constraints shape how that is done:

           - It has to be the declarative <StatusBar>, not setStatusBarStyle()
             in a focus effect. RN keeps a stack of status bar entries; the root
             layout's <StatusBar style="dark" /> is the baseline. Coming from
             sign-in (which is also light), sign-in's entry pops on unmount and
             the baseline dark takes over *in that commit*, while a focus effect
             only runs once navigation settles focus — the gap between the two
             is a visible black flash. Mounting an entry here applies in the
             same commit instead.
           - It has to be gated on focus, because tab screens stay mounted; an
             ungated entry would keep the icons white on tabs that exclude this
             header and are therefore still white-backed. */}
      {isFocused && <StatusBar style="light" />}

      <View
        className="pl-5 pr-8 pb-4"
        style={{ backgroundColor: HEADER_BG, paddingTop: insets.top + 8 }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-11 h-11 rounded-full bg-[#032252] border-2 border-white items-center justify-center overflow-hidden">
              {avatarUri && !imageLoadFailed ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-full h-full"
                  onError={() => setImageLoadFailed(true)}
                />
              ) : (
                <Text className="text-white text-base font-bold">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[13px] text-white/70">Hello,</Text>
              <Text className="text-[15px] font-semibold text-white" numberOfLines={1}>
                {firstName || 'there'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Image
              source={require('../../../../assets/images/welcome/NeatPayLogo.png')}
              className="w-[84px] h-8 mr-4"
              resizeMode="contain"
            />
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View className="absolute top-0 right-0 bg-[#EF4444] rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}
