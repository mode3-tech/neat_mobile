import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  const pinChange = useSecurityChangeStore((s) => s.pinChange);
  const clearPinChange = useSecurityChangeStore((s) => s.clearPinChange);
  const hadPinChange = useRef(!!pinChange);

  useEffect(() => {
    if (!hadPinChange.current) {
      setSessionExpired(true);
    }
  }, []);

  const canProceed =
    currentPin.length === PIN_LENGTH &&
    newPin.length === PIN_LENGTH &&
    confirmNewPin.length === PIN_LENGTH;

  const handleChangePin = async () => {
    if (!canProceed || loading || !pinChange) return;
    if (newPin !== confirmNewPin) {
      setErrorField('confirm');
      return;
    }
    if (newPin === currentPin) {
      setErrorField('new');
      setErrorMessage('New PIN must be different from current PIN.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await authService.changePin({
        verification_id: pinChange.verificationId,
        current_pin: currentPin,
        new_pin: newPin,
        confirm_new_pin: confirmNewPin,
      });
      clearPinChange();
      router.replace({
        pathname: '/(profile)/success' as any,
        params: {
          title: 'PIN Changed Successfully',
          message: 'Your transaction PIN has been updated. Use your new PIN for future transactions.',
        },
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to change PIN.');
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
            Please start the PIN change again.
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
            setErrorMessage('');
          }}
          hasError={errorField === 'current'}
        />
        <PinField
          label="New PIN"
          value={newPin}
          onChangeText={(t) => {
            setNewPin(t);
            setErrorField(null);
            setErrorMessage('');
          }}
          hasError={errorField === 'new'}
        />
        <PinField
          label="Confirm New PIN"
          value={confirmNewPin}
          onChangeText={(t) => {
            setConfirmNewPin(t);
            setErrorField(null);
            setErrorMessage('');
          }}
          hasError={errorField === 'confirm'}
        />
        {errorField === 'confirm' && (
          <Text className="text-xs text-[#EF4444] -mt-3 mb-2">PINs do not match</Text>
        )}
        {errorMessage ? (
          <View className="bg-[#FEF2F2] rounded-xl px-4 py-3 mt-2">
            <Text className="text-[13px] text-[#EF4444]">{errorMessage}</Text>
          </View>
        ) : null}

        <View className="flex-1" />

        <View className="pb-4">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
            onPress={handleChangePin}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}>
                Change PIN
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
