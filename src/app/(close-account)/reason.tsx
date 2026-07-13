import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

const MAX_REASON_CHARS = 300;

const REASONS = [
  { value: 'no_need', label: "Don't need a NEATPay account" },
  { value: 'poor_service', label: 'Poor customer service' },
  { value: 'security', label: 'Worried about account security' },
  { value: 'other', label: 'Other' },
] as const;

type ReasonValue = (typeof REASONS)[number]['value'];

export default function CloseAccountReasonScreen() {
  const [selected, setSelected] = useState<ReasonValue | null>(null);
  const [otherText, setOtherText] = useState('');

  const canSubmit =
    selected !== null && (selected !== 'other' || otherText.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    // TODO: wire when close-account endpoint is ready.
    toast.info('Account closure requests are coming soon.');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4 bg-white">
        <TouchableOpacity
          className="border border-gray-200 rounded-full w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#1A1A1A] mr-10">
          Close Account
        </Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <Text className="text-[22px] font-bold text-[#1A1A1A] mt-4 mb-6">
          Why do you want to close your account?
        </Text>

        {REASONS.map((reason) => {
          const isSelected = selected === reason.value;
          return (
            <View key={reason.value}>
              <TouchableOpacity
                className="flex-row items-center bg-white rounded-2xl px-4 py-4 mb-3"
                onPress={() => setSelected(reason.value)}
                activeOpacity={0.7}
              >
                <Text className="flex-1 text-[15px] text-[#1A1A1A]">{reason.label}</Text>
                <MaterialCommunityIcons
                  name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color={isSelected ? '#472FF8' : '#9CA3AF'}
                />
              </TouchableOpacity>

              {reason.value === 'other' && isSelected && (
                <View className="bg-white rounded-2xl px-4 py-3 mb-3">
                  <View className="flex-row justify-end mb-1">
                    <Text className="text-[12px] text-gray-400">
                      {otherText.length}/{MAX_REASON_CHARS}
                    </Text>
                  </View>
                  <TextInput
                    className="text-[15px] text-[#1A1A1A]"
                    value={otherText}
                    onChangeText={setOtherText}
                    placeholder="Tell us more…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={MAX_REASON_CHARS}
                    textAlignVertical="top"
                    style={{ minHeight: 96 }}
                  />
                </View>
              )}
            </View>
          );
        })}

        <View className="flex-1" />

        <TouchableOpacity
          className={`rounded-full py-4 items-center mt-6 ${
            canSubmit ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text
            className={`text-base font-semibold ${
              canSubmit ? 'text-white' : 'text-gray-400'
            }`}
          >
            Submit
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
