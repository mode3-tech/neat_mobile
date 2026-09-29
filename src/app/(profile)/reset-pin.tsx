import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderScreen } from '@/components/ui/header-screen';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';

import { PinField } from '@/components/ui/pin-field';
import { SessionExpiredCard } from '@/components/ui/session-expired-card';
import { PIN_LENGTH } from '@/constants';
import { authService } from '@/services/auth.service';
import { clearStoredTransactionPin } from '@/services/biometric.service';
import { getErrorMessage } from '@/utils/error';
import { BackButton } from '@/components/ui/back-button';

export default function ResetPinScreen() {
  const { verificationId } = useLocalSearchParams<{ verificationId: string }>();

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState<'confirm' | null>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const insets = useSafeAreaInsets();

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
    <HeaderScreen padded={false}>
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footerHeight + 20}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-6">
          <BackButton className="" />
          <Text
            className="text-[22px] font-bold text-[#1A1A1A] leading-[26px]"
            style={{ includeFontPadding: false }}
          >
            Reset Transaction PIN
          </Text>
        </View>

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
      </KeyboardAwareScrollView>

      {/* Keyboard height includes the bottom inset HeaderScreen already pads, so lift by the difference. */}
      <KeyboardStickyView
        offset={{ opened: insets.bottom }}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <View className="px-6 pb-4 bg-white">
          <TouchableOpacity
            className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#F9B700]' : 'bg-[#E5E7EB]'}`}
            onPress={handleResetPin}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#032252" />
            ) : (
              <Text
                className={`text-base font-semibold ${canProceed ? 'text-[#032252]' : 'text-gray-400'}`}
              >
                Reset PIN
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>
    </HeaderScreen>
  );
}
