import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { PinField } from '@/components/ui/pin-field';
import { SessionExpiredCard } from '@/components/ui/session-expired-card';
import { PIN_LENGTH } from '@/constants';
import { authService } from '@/services/auth.service';
import { clearStoredTransactionPin } from '@/services/biometric.service';
import { useSecurityChangeStore } from '@/stores/security-change.store';
import { getErrorMessage } from '@/utils/error';
import { colors } from '@/theme/palette';

export default function ChangePinScreen() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState<'current' | 'new' | 'confirm' | null>(null);
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
      toast.error('PIN change failed', {
        description: 'New PIN must be different from current PIN.',
      });
      return;
    }
    setLoading(true);
    try {
      await authService.changePin({
        verification_id: pinChange.verificationId,
        current_pin: currentPin,
        new_pin: newPin,
        confirm_new_pin: confirmNewPin,
      });
      // The old PIN cached for biometric auth is now invalid; clearing is
      // best-effort — the change already succeeded on the backend.
      await clearStoredTransactionPin().catch(() => {});
      clearPinChange();
      router.replace({
        pathname: '/(profile)/success' as any,
        params: {
          title: 'PIN Changed Successfully',
          message: 'Your transaction PIN has been updated. Use your new PIN for future transactions.',
        },
      });
    } catch (err: unknown) {
      toast.error('PIN change failed', { description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  if (sessionExpired) {
    return <SessionExpiredCard message="Please start the PIN change again." />;
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

        <Text className="text-[22px] font-bold text-ink mb-6">Change Transaction PIN</Text>

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
          <Text className="text-xs text-danger -mt-3 mb-2">PINs do not match</Text>
        )}

        <View className="flex-1" />

        <View className="pb-4">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${canProceed ? 'bg-primary' : 'bg-surface-disabled'}`}
            onPress={handleChangePin}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.inkInverse} />
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
