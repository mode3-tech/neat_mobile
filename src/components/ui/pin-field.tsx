import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PIN_LENGTH } from '@/constants';
import { colors } from '@/theme/palette';

interface PinFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  hasError?: boolean;
}

export function PinField({ label, value, onChangeText, hasError = false }: PinFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View className="mb-5">
      <Text className="text-[13px] font-semibold text-ink-body mb-2">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl px-4 py-[14px] border-[1.5px] ${
          hasError ? 'bg-white border-danger' : 'bg-surface-input border-transparent'
        }`}
      >
        <TextInput
          className="flex-1 text-[15px] text-ink p-0"
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, PIN_LENGTH))}
          placeholder="—"
          placeholderTextColor={colors.inkMuted}
          secureTextEntry={!show}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
        />
        <TouchableOpacity onPress={() => setShow((v) => !v)}>
          <Text className="text-base text-ink-muted">{show ? '👁' : '👁‍🗨'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
