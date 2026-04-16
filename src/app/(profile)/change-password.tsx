import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { authService } from '@/services/auth.service';
import { useSecurityChangeStore } from '@/stores/security-change.store';

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
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const setPasswordChange = useSecurityChangeStore((s) => s.setPasswordChange);

  const passedCount = REQUIREMENTS.filter((r) => r.test(newPassword)).length;
  const isValidNew = newPassword.length >= 8 && passedCount >= 3;
  const isMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0;
  const canProceed =
    currentPassword.length > 0 && newPassword.length > 0 && confirmNewPassword.length > 0;

  const handleContinue = async () => {
    if (!canProceed || loading) return;
    if (!isValidNew || !isMatch) {
      setHasError(true);
      return;
    }
    if (newPassword === currentPassword) {
      setHasError(true);
      setErrorMessage('New password must be different from current password.');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordChange();
      setPasswordChange({ currentPassword, newPassword, confirmNewPassword });
      router.push('/(profile)/change-password-otp' as any);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
            onPress={() => router.back()}
          >
            <Text className="text-sm text-gray-700 font-medium">Back</Text>
          </TouchableOpacity>

          <PwField
            label="Current Password"
            value={currentPassword}
            onChangeText={(t) => {
              setCurrentPassword(t);
              setHasError(false);
              setErrorMessage('');
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
              setErrorMessage('');
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
              setErrorMessage('');
            }}
            hasError={hasError && !isMatch}
            placeholder="Re-enter new password"
          />
          {hasError && !isMatch && confirmNewPassword.length > 0 && (
            <Text className="text-xs text-[#EF4444] -mt-3">Passwords do not match</Text>
          )}
          {errorMessage ? (
            <View className="bg-[#FEF2F2] rounded-xl px-4 py-3 mt-2">
              <Text className="text-[13px] text-[#EF4444]">{errorMessage}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="px-6 pb-4">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
            onPress={handleContinue}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
