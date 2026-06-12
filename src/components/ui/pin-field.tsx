import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PIN_LENGTH } from '@/constants';

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
      <Text className="text-[13px] font-semibold text-gray-700 mb-2">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl px-4 py-[14px] border-[1.5px] ${
          hasError ? 'bg-white border-[#EF4444]' : 'bg-[#F5F5F5] border-transparent'
        }`}
      >
        <TextInput
          className="flex-1 text-[15px] text-[#1A1A1A] p-0"
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, PIN_LENGTH))}
          placeholder="—"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
        />
        <TouchableOpacity onPress={() => setShow((v) => !v)}>
          <Text className="text-base text-gray-400">{show ? '👁' : '👁‍🗨'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
