import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PIN_LENGTH } from '@/constants';
import { authService } from '@/services/auth.service';
import { useSecurityChangeStore } from '@/stores/security-change.store';

interface PinFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  hasError: boolean;
}

function PinField({ label, value, onChangeText, hasError }: PinFieldProps) {
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

export default function ChangePinScreen() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState<'current' | 'new' | 'confirm' | null>(null);
  const setPinChange = useSecurityChangeStore((s) => s.setPinChange);

  const canProceed =
    currentPin.length === PIN_LENGTH &&
    newPin.length === PIN_LENGTH &&
    confirmNewPin.length === PIN_LENGTH;

  const handleContinue = async () => {
    if (!canProceed || loading) return;
    if (newPin !== confirmNewPin) {
      setErrorField('confirm');
      return;
    }
    if (newPin === currentPin) {
      setErrorField('new');
      Alert.alert('Invalid PIN', 'New PIN must be different from current PIN.');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPinChange();
      setPinChange({ currentPin, newPin, confirmNewPin });
      router.push('/(profile)/change-pin-otp' as any);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1 px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-sm text-gray-700 font-medium">Back</Text>
        </TouchableOpacity>

        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Change Transaction PIN</Text>

        <PinField
          label="Current PIN"
          value={currentPin}
          onChangeText={(t) => {
            setCurrentPin(t);
            setErrorField(null);
          }}
          hasError={errorField === 'current'}
        />
        <PinField
          label="New PIN"
          value={newPin}
          onChangeText={(t) => {
            setNewPin(t);
            setErrorField(null);
          }}
          hasError={errorField === 'new'}
        />
        <PinField
          label="Confirm New PIN"
          value={confirmNewPin}
          onChangeText={(t) => {
            setConfirmNewPin(t);
            setErrorField(null);
          }}
          hasError={errorField === 'confirm'}
        />
        {errorField === 'confirm' && (
          <Text className="text-xs text-[#EF4444] -mt-3 mb-2">PINs do not match</Text>
        )}

        <View className="flex-1" />

        <View className="pb-4">
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
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
