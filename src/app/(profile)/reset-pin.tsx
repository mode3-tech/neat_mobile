import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';

import { PinField } from '@/components/ui/pin-field';
import { SessionExpiredCard } from '@/components/ui/session-expired-card';
import { PIN_LENGTH } from '@/constants';
import { authService } from '@/services/auth.service';
import { clearStoredTransactionPin } from '@/services/biometric.service';
import { getErrorMessage } from '@/utils/error';

export default function ResetPinScreen() {
  const { verificationId } = useLocalSearchParams<{ verificationId: string }>();

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState<'confirm' | null>(null);

  const canProceed = newPin.length === PIN_LENGTH && confirmNewPin.length === PIN_LENGTH;

  const handleResetPin = async () => {
    if (!canProceed || loading || !verificationId) return;
    if (newPin !== confirmNewPin) {
      setErrorField('confirm');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPin({
        verification_id: verificationId,
        new_pin: newPin,
        confirm_new_pin: confirmNewPin,
      });
    } catch (err: unknown) {
      toast.error('PIN reset failed', { description: getErrorMessage(err) });
      setLoading(false);
      return;
    }
    // The old PIN cached for biometric auth is now invalid; clearing is
    // best-effort — the reset already succeeded on the backend.
    await clearStoredTransactionPin().catch(() => {});
    setLoading(false);
    toast.success('PIN reset successfully', {
      description: 'Use your new PIN for this transaction.',
    });
    router.back();
  };

  if (!verificationId) {
    return <SessionExpiredCard message="Please start the PIN reset again." />;
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

        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Reset Transaction PIN</Text>

        <PinField
          label="New PIN"
          value={newPin}
          onChangeText={(t) => {
            setNewPin(t);
            setErrorField(null);
          }}
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
            onPress={handleResetPin}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}>
                Reset PIN
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
