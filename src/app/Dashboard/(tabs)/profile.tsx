import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { File } from 'expo-file-system';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useProfileStore } from '@/stores/profile.store';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PhotoPickerSheet } from '@/components/ui/PhotoPickerSheet';
import { PrimaryRefreshControl } from '@/components/ui/refresh-control';
import { Icon, type IconName } from '@/theme/icons';
import { colors } from '@/theme/palette';

interface RowProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

function SettingsRow({ icon, label, onPress, disabled }: RowProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl px-4 py-4 mb-3"
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View className="w-9 h-9 rounded-full bg-primary-surface items-center justify-center mr-3">
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <Text className={`flex-1 text-[15px] ${disabled ? 'text-ink-muted' : 'text-ink'}`}>
        {label}
      </Text>
      <Icon name="chevronRight" size={22} color={colors.inkMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const photoUri = useProfileStore((s) => s.photoUri);
  const setPhotoUri = useProfileStore((s) => s.setPhotoUri);
  const photoCacheBuster = useProfileStore((s) => s.photoCacheBuster);
  const bumpPhotoCacheBuster = useProfileStore((s) => s.bumpPhotoCacheBuster);
  const clearPhoto = useProfileStore((s) => s.clearPhoto);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  const {
    data: summary,
    dataUpdatedAt: summaryUpdatedAt,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  const fullName = summary?.full_name ?? '';
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0]!.charAt(0)}${nameParts[nameParts.length - 1]!.charAt(0)}`.toUpperCase()
      : fullName.charAt(0).toUpperCase() || 'U';
  const rawAvatarUri: string | null = summary?.profile_picture || photoUri || null;
  // Append a cache buster to remote URLs so RN's image cache fetches fresh
  // bytes after an upload, even if the backend reuses the same URL.
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

  const uploadPhotoMutation = useMutation({
    mutationFn: (uri: string) =>
      accountService.updateProfile({ profile_picture_uri: uri }),
    onMutate: (newUri: string) => {
      const prev = useProfileStore.getState().photoUri;
      setPhotoUri(newUri);
      return { prev };
    },
    onSuccess: (_data, newUri, ctx) => {
      if (ctx?.prev && ctx.prev.startsWith('file://') && ctx.prev !== newUri) {
        try { new File(ctx.prev).delete(); } catch {}
      }
      bumpPhotoCacheBuster();
      setImageLoadFailed(false);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: (err, newUri, ctx) => {
      setPhotoUri(ctx?.prev ?? null);
      if (newUri.startsWith('file://')) {
        try { new File(newUri).delete(); } catch {}
      }
      Alert.alert(
        'Upload failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logoutUser,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onSettled: () => {
      queryClient.clear();
      clearAuth();
      clearPhoto();
      setLogoutVisible(false);
      router.replace('/welcome');
    },
  });

  const handleLogout = () => {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-subtle" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PrimaryRefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-2 pb-4">
          {/* <TouchableOpacity
            className="border border-line rounded-full px-4 py-1.5 bg-white"
            onPress={() => router.back()}
          >
            <Text className="text-sm text-ink-body font-medium">Back</Text>
          </TouchableOpacity> */}
          <Text className="flex-1 text-center text-lg font-bold text-ink">
            Profile
          </Text>
        </View>

        {/* Avatar */}
        <View className="items-center mb-4">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center overflow-hidden">
              {avatarUri && !imageLoadFailed ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-full h-full"
                  onError={() => setImageLoadFailed(true)}
                />
              ) : (
                <Text className="text-white text-3xl font-bold">{initials}</Text>
              )}
              {uploadPhotoMutation.isPending && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <ActivityIndicator color={colors.inkInverse} />
                </View>
              )}
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-white"
              onPress={() => setPhotoSheetVisible(true)}
              activeOpacity={0.85}
              disabled={uploadPhotoMutation.isPending}
            >
              <Icon name="camera" size={16} color={colors.inkInverse} />
            </TouchableOpacity>
          </View>
          <Text className="mt-3 text-base font-semibold text-ink">
            {fullName || 'Loading...'}
          </Text>
          {/* <Text className="text-sm text-success font-medium">Verified</Text> */}
        </View>

        {/* PROFILE section */}
        <Text className="px-6 text-xs font-semibold text-ink-soft tracking-wide mb-2">
          PROFILE
        </Text>
        <View className="px-6">
          <SettingsRow
            icon="userSettings"
            label="Change Personal Data"
            onPress={() => router.push('/(profile)/personal-data' as any)}
          />
          {/* <SettingsRow icon="idCard" label="Account Details" disabled /> */}
        </View>

        {/* SECURITY section */}
        <Text className="px-6 text-xs font-semibold text-ink-soft tracking-wide mb-2 mt-4">
          SECURITY & SETTINGS
        </Text>
        <View className="px-6">
          <SettingsRow
            icon="key"
            label="Change Transaction PIN"
            onPress={() => router.push('/(profile)/change-pin-otp' as any)}
          />
          <SettingsRow
            icon="lock"
            label="Change Password"
            onPress={() => router.push('/(profile)/change-password-otp' as any)}
          />
          <SettingsRow
            icon="bell"
            label="Notifications"
            onPress={() => router.push('/(profile)/notifications' as any)}
          />
          <SettingsRow
            icon="fingerprint"
            label="Biometrics Settings"
            onPress={() => router.push('/(profile)/biometrics' as any)}
          />
          <SettingsRow
            icon="power"
            label="Close Account"
            onPress={() => router.push('/(close-account)/intro' as any)}
          />
        </View>

        {/* Logout */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-full py-4 border border-danger-border bg-danger-surface"
            onPress={() => setLogoutVisible(true)}
            activeOpacity={0.85}
          >
            <Icon name="logout" size={18} color={colors.danger} />
            <Text className="text-danger text-base font-semibold ml-2">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={logoutVisible}
        title="Do you really want to log out?"
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
        loading={logoutMutation.isPending}
      />

      <PhotoPickerSheet
        visible={photoSheetVisible}
        currentPhotoUri={avatarUri}
        onClose={() => setPhotoSheetVisible(false)}
        onSelect={(uri) => uploadPhotoMutation.mutate(uri)}
      />
    </SafeAreaView>
  );
}
