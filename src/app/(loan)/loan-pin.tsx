import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { loanService } from '@/services/loan.service';
import { PIN_LENGTH } from '@/constants';

export default function LoanPinScreen() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canConfirm = pin.length === PIN_LENGTH;

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await loanService.submitApplication(pin);
      router.push('/(loan)/loan-success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1.5">Enter PIN</Text>
      <Text className="text-[13px] text-[#6B7280] leading-5 mb-7">
        Enter your 4-digit PIN to confirm loan application
      </Text>

      <View className="mb-5">
        <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
          <TextInput
            className="flex-1 text-[15px] text-[#1A1A1A] p-0"
            value={pin}
            onChangeText={(t) => {
              setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH));
              setErrorMsg('');
            }}
            placeholder="••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPin}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
          />
          <TouchableOpacity onPress={() => setShowPin((v) => !v)}>
            <MaterialCommunityIcons
              name={showPin ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        {errorMsg !== '' && (
          <Text className="text-xs text-red-500 mt-1.5">{errorMsg}</Text>
        )}
      </View>

      <View className="flex-1" />

      <View className="pb-4">
        <TouchableOpacity
          className={`rounded-full py-4 items-center ${canConfirm ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
          onPress={handleConfirm}
          disabled={!canConfirm || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-semibold ${canConfirm ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Confirm
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
