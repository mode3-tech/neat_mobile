import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { accountService } from '@/services/account.service';
import type { AccountSummary } from '@/types/account.types';

function formatDob(dob: string | undefined): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

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
  const inputRef = useRef<TextInput>(null);
  const mountStateRef = useRef({ value, editable });

  useEffect(() => {
    // Android EditText puts the cursor at text.length after a prop-driven
    // setText, scrolling long prefilled values out of view. Reset to start.
    const { value: initialValue, editable: initialEditable } = mountStateRef.current;
    if (Platform.OS === 'android' && initialEditable && initialValue) {
      inputRef.current?.setSelection(0, 0);
    }
  }, []);

  return (
    <View className="mb-4">
      <Text className="text-[13px] font-semibold text-gray-700 mb-2">{label}</Text>
      <View className={`rounded-xl ${editable ? 'bg-[#F5F5F5]' : 'bg-[#ECECEC]'}`}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className={`text-[15px] px-4 py-[14px] ${editable ? 'text-[#1A1A1A]' : 'text-gray-500'}`}
        />
      </View>
    </View>
  );
}

export default function PersonalDataScreen() {
  const { data: summary, isError, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });

  if (!summary) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-2">
          <TouchableOpacity
            className="self-start border border-gray-200 rounded-full px-4 py-1.5"
            onPress={() => router.back()}
          >
            <Text className="text-sm text-gray-700 font-medium">Back</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          {isError ? (
            <>
              <Text className="text-base font-semibold text-[#1A1A1A] mb-2">
                Couldn&apos;t load your profile
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                Please check your connection and try again.
              </Text>
              <TouchableOpacity
                className="rounded-full py-3 px-8 bg-[#472FF8]"
                onPress={() => refetch()}
                disabled={isFetching}
                activeOpacity={0.85}
              >
                {isFetching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">Retry</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator color="#472FF8" />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return <PersonalDataForm summary={summary} />;
}

function PersonalDataForm({ summary }: { summary: AccountSummary }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(summary.email ?? '');
  const [address, setAddress] = useState(summary.address ?? '');
  const [saving, setSaving] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await accountService.updateProfile({
        email: email || undefined,
        address: address || undefined,
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      router.back();
    } catch (err) {
      if (isMountedRef.current) {
        Alert.alert('Update failed', err instanceof Error ? err.message : 'Please try again.');
        setSaving(false);
      }
    }
  };

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
      </KeyboardAwareScrollView>

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
    </SafeAreaView>
  );
}
