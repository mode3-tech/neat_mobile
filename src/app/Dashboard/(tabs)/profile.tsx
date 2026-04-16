import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';
import { useAuthStore } from '@/stores/auth.store';
import { useProfileStore } from '@/stores/profile.store';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PhotoPickerSheet } from '@/components/ui/PhotoPickerSheet';

interface RowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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
      <View className="w-9 h-9 rounded-full bg-[#EEF0FF] items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon} size={18} color="#472FF8" />
      </View>
      <Text className={`flex-1 text-[15px] ${disabled ? 'text-gray-400' : 'text-[#1A1A1A]'}`}>
        {label}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const photoUri = useProfileStore((s) => s.photoUri);
  const setPhotoUri = useProfileStore((s) => s.setPhotoUri);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: summary } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  const fullName = summary?.full_name ?? '';
  const initial = fullName.charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    setLogoutVisible(false);
    clearAuth();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-2 pb-4">
          {/* <TouchableOpacity
            className="border border-gray-200 rounded-full px-4 py-1.5 bg-white"
            onPress={() => router.back()}
          >
            <Text className="text-sm text-gray-700 font-medium">Back</Text>
          </TouchableOpacity> */}
          <Text className="flex-1 text-center text-lg font-bold text-[#1A1A1A]">
            Profile
          </Text>
        </View>

        {/* Avatar */}
        <View className="items-center mb-4">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-[#472FF8] items-center justify-center overflow-hidden">
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-full h-full" />
              ) : (
                <Text className="text-white text-3xl font-bold">{initial}</Text>
              )}
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#472FF8] items-center justify-center border-2 border-white"
              onPress={() => setPhotoSheetVisible(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="mt-3 text-base font-semibold text-[#1A1A1A]">
            {fullName || 'Loading...'}
          </Text>
          {/* <Text className="text-sm text-[#16A34A] font-medium">Verified</Text> */}
        </View>

        {/* PROFILE section */}
        <Text className="px-6 text-xs font-semibold text-gray-500 tracking-wide mb-2">
          PROFILE
        </Text>
        <View className="px-6">
          <SettingsRow
            icon="account-outline"
            label="Change Personal Data"
            onPress={() => router.push('/(profile)/personal-data' as any)}
          />
          <SettingsRow icon="card-account-details-outline" label="Account Details" disabled />
        </View>

        {/* SECURITY section */}
        <Text className="px-6 text-xs font-semibold text-gray-500 tracking-wide mb-2 mt-4">
          SECURITY & SETTINGS
        </Text>
        <View className="px-6">
          <SettingsRow
            icon="key-outline"
            label="Change Transaction PIN"
            onPress={() => router.push('/(profile)/change-pin-otp' as any)}
          />
          <SettingsRow
            icon="lock-outline"
            label="Change Password"
            onPress={() => router.push('/(profile)/change-password' as any)}
          />
          <SettingsRow
            icon="bell-outline"
            label="Notifications"
            onPress={() => router.push('/(profile)/notifications' as any)}
          />
          <SettingsRow
            icon="fingerprint"
            label="Biometrics Settings"
            onPress={() => router.push('/(profile)/biometrics' as any)}
          />
        </View>

        {/* Logout */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-full py-4 border border-[#FECACA] bg-[#FEF2F2]"
            onPress={() => setLogoutVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
            <Text className="text-[#EF4444] text-base font-semibold ml-2">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={logoutVisible}
        title="Do you really want to log out?"
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
      />

      <PhotoPickerSheet
        visible={photoSheetVisible}
        currentPhotoUri={photoUri}
        onClose={() => setPhotoSheetVisible(false)}
        onSelect={(uri) => setPhotoUri(uri)}
      />
    </SafeAreaView>
  );
}
