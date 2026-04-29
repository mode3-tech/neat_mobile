import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { authService } from '@/services/auth.service';
import { useSecurityChangeStore } from '@/stores/security-change.store';
import { getErrorMessage } from '@/utils/error';

const REQUIREMENTS = [
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

interface PwFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  hasError: boolean;
  placeholder?: string;
}

function PwField({ label, value, onChangeText, hasError, placeholder }: PwFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View className="mb-5">
      <Text className="text-[13px] font-semibold text-gray-700 mb-2">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl px-4 py-[14px] border-[1.5px] ${
          hasError ? 'bg-white border-[#EF4444]' : 'bg-[#F5F5F5] border-transparent'
        }`}
      >
        <TextInput
          className="flex-1 text-[15px] text-[#1A1A1A] p-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShow((v) => !v)}>
          <Text className="text-base text-gray-400">{show ? '👁' : '👁‍🗨'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const passwordChange = useSecurityChangeStore((s) => s.passwordChange);
  const clearPasswordChange = useSecurityChangeStore((s) => s.clearPasswordChange);
  const hadPasswordChange = useRef(!!passwordChange);

  useEffect(() => {
    if (!hadPasswordChange.current) {
      setSessionExpired(true);
    }
  }, []);

  const passedCount = REQUIREMENTS.filter((r) => r.test(newPassword)).length;
  const isValidNew = newPassword.length >= 8 && passedCount >= 3;
  const isMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0;
  const canProceed =
    currentPassword.length > 0 && newPassword.length > 0 && confirmNewPassword.length > 0;

  const handleChangePassword = async () => {
    if (!canProceed || loading || !passwordChange) return;
    if (!isValidNew || !isMatch) {
      setHasError(true);
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('Password change failed', {
        description: 'New password must be different from current password.',
      });
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({
        verification_id: passwordChange.verificationId,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      clearPasswordChange();
      router.replace({
        pathname: '/(profile)/success' as any,
        params: {
          title: 'Password Changed Successfully',
          message: 'Your password has been updated. Use your new password the next time you sign in.',
        },
      });
    } catch (err: unknown) {
      toast.error('Password change failed', { description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  if (sessionExpired) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6 justify-center items-center">
        <View className="bg-[#FEF2F2] rounded-2xl px-6 py-8 items-center w-full">
          <Text className="text-lg font-bold text-[#1A1A1A] mb-2">Session Expired</Text>
          <Text className="text-[13px] text-gray-500 text-center leading-5 mb-6">
            Please start the password change again.
          </Text>
          <TouchableOpacity
            className="bg-[#472FF8] rounded-full py-3.5 px-10"
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text className="text-white text-sm font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
          <TouchableOpacity
            className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
            onPress={() => router.back()}
          >
            <Text className="text-sm text-gray-700 font-medium">Back</Text>
          </TouchableOpacity>

          <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Change Password</Text>

          <PwField
            label="Current Password"
            value={currentPassword}
            onChangeText={(t) => {
              setCurrentPassword(t);
              setHasError(false);
            }}
            hasError={false}
            placeholder="Enter current password"
          />

          <PwField
            label="New Password"
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              setHasError(false);
            }}
            hasError={hasError && !isValidNew}
            placeholder="Enter new password"
          />

          <View className="mb-5 -mt-2">
            <Text className={`text-xs leading-[18px] mb-1 ${hasError && !isValidNew ? 'text-[#EF4444]' : 'text-gray-500'}`}>
              Make sure your password is 8 or more characters and has at least 3 of the following:
            </Text>
            {REQUIREMENTS.map((r) => (
              <View key={r.label} className="flex-row gap-1.5">
                <Text className={`text-xs leading-[18px] ${hasError && !isValidNew ? 'text-[#EF4444]' : 'text-gray-500'}`}>
                  •
                </Text>
                <Text className={`text-xs leading-[18px] ${hasError && !isValidNew ? 'text-[#EF4444]' : 'text-gray-500'}`}>
                  {r.label}
                </Text>
              </View>
            ))}
          </View>

          <PwField
            label="Confirm New Password"
            value={confirmNewPassword}
            onChangeText={(t) => {
              setConfirmNewPassword(t);
              setHasError(false);
            }}
            hasError={hasError && !isMatch}
            placeholder="Re-enter new password"
          />
          {hasError && !isMatch && confirmNewPassword.length > 0 && (
            <Text className="text-xs text-[#EF4444] -mt-3">Passwords do not match</Text>
          )}

        <View className="flex-1" />

        <View className="pb-4">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
            onPress={handleChangePassword}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}>
                Change Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
