import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { accountService } from '@/services/account.service';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getCloseBlockerMessage } from '@/utils/close-account';
import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

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
  const [confirmVisible, setConfirmVisible] = useState(false);

  const canSubmit =
    selected !== null && (selected !== 'other' || otherText.trim().length > 0);

  const closeMutation = useMutation({
    mutationFn: (reasonNote: string) => accountService.closeAccount(reasonNote),
    onSuccess: (res) => {
      setConfirmVisible(false);
      if (res.status === 'blocked' || res.blocker_code) {
        router.push({
          pathname: '/(close-account)/result',
          params: {
            variant: 'blocked',
            message: getCloseBlockerMessage(res.blocker_code, res.blocker_details),
          },
        });
        return;
      }
      router.replace('/(close-account)/success');
    },
    onError: (err) => {
      setConfirmVisible(false);
      router.push({
        pathname: '/(close-account)/result',
        params: {
          variant: 'error',
          message: err instanceof Error ? err.message : 'Please try again.',
        },
      });
    },
  });

  const handleSubmit = () => {
    if (!canSubmit || closeMutation.isPending) return;
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    if (closeMutation.isPending) return;
    const reasonNote =
      selected === 'other'
        ? otherText.trim()
        : REASONS.find((r) => r.value === selected)?.label ?? '';
    closeMutation.mutate(reasonNote);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-subtle" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4 bg-white">
        <TouchableOpacity
          className="border border-line rounded-full w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <Icon name="back" size={24} color={colors.inkBody} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-ink mr-10">
          Close Account
        </Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <Text className="text-[22px] font-bold text-ink mt-4 mb-6">
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
                <Text className="flex-1 text-[15px] text-ink">{reason.label}</Text>
                <Icon
                  name={isSelected ? 'radioOn' : 'radioOff'}
                  size={22}
                  color={isSelected ? colors.primary : colors.inkMuted}
                />
              </TouchableOpacity>

              {reason.value === 'other' && isSelected && (
                <View className="bg-white rounded-2xl px-4 py-3 mb-3">
                  <View className="flex-row justify-end mb-1">
                    <Text className="text-[12px] text-ink-muted">
                      {otherText.length}/{MAX_REASON_CHARS}
                    </Text>
                  </View>
                  <TextInput
                    className="text-[15px] text-ink"
                    value={otherText}
                    onChangeText={setOtherText}
                    placeholder="Tell us more…"
                    placeholderTextColor={colors.inkMuted}
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
            canSubmit ? 'bg-primary' : 'bg-surface-disabled'
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit || closeMutation.isPending}
          activeOpacity={0.85}
        >
          {closeMutation.isPending ? (
            <ActivityIndicator color={colors.inkInverse} />
          ) : (
            <Text
              className={`text-base font-semibold ${
                canSubmit ? 'text-white' : 'text-ink-muted'
              }`}
            >
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="Close account permanently? This action can't be undone."
        confirmLabel="Yes, close it"
        cancelLabel="Cancel"
        confirmStyle="danger"
        loading={closeMutation.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}
