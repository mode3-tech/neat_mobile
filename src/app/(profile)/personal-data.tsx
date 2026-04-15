import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';

interface FieldProps {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-semibold text-gray-700 mb-2">{label}</Text>
      <View className={`rounded-xl px-4 py-[14px] ${editable ? 'bg-[#F5F5F5]' : 'bg-[#ECECEC]'}`}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className={`text-[15px] p-0 ${editable ? 'text-[#1A1A1A]' : 'text-gray-500'}`}
        />
      </View>
    </View>
  );
}

export default function PersonalDataScreen() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const prefilledRef = useRef(false);

  const { data: summary } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  useEffect(() => {
    if (summary && !prefilledRef.current) {
      setEmail(summary.email ?? '');
      setAddress(summary.address ?? '');
      prefilledRef.current = true;
    }
  }, [summary]);

  const formatDob = (dob: string | undefined): string => {
    if (!dob) return '';
    const d = new Date(dob);
    if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await accountService.updateProfile({
        email: email || undefined,
        address: address || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      router.back();
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
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

          <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Personal Data</Text>

          <Field
            label="Full Name"
            value={summary?.full_name ?? ''}
            editable={false}
            placeholder="Enter your name"
          />
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Field
            label="Phone Number"
            value={summary?.phone_number ?? ''}
            editable={false}
          />
          <Field
            label="Date of Birth"
            value={formatDob(summary?.dob)}
            editable={false}
          />
          <Field
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            autoCapitalize="words"
          />
          <Field
            label="BVN"
            value={summary?.bvn ?? ''}
            editable={false}
          />
        </ScrollView>

        <View className="px-6 pb-4">
          <TouchableOpacity
            className="rounded-full py-4 items-center bg-[#472FF8]"
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
