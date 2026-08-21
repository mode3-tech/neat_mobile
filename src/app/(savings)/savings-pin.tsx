import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { QUERY_KEYS } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { savingsService } from '@/services/savings.service';
import { useSavingsStore } from '@/stores/savings.store';
import { getErrorMessage } from '@/utils/error';

export default function SavingsPinScreen() {
  const store = useSavingsStore();
  const queryClient = useQueryClient();
  const {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  } = useBiometricAuth();

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitDeposit = async (transactionPin: string) => {
    setSubmitting(true);
    try {
      await savingsService.deposit({
        amount: parseFloat(store.amount),
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      setPin('');
      store.reset();
      router.replace('/Dashboard');
    } catch (err: unknown) {
      toast.error('Deposit failed', { description: getErrorMessage(err) });
      // Clear so the user can retry — the pad auto-submits on the 4th digit,
      // so a tray left full has no way to accept input.
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometric = async () => {
    if (authenticating || submitting) return;
    const storedPin = await authenticateWithBiometric();
    if (!storedPin) {
      toast.error('Authentication failed', {
        description: 'Biometric authentication failed. Please use your PIN.',
      });
      return;
    }
    submitDeposit(storedPin);
  };

  return (
    <PinKeypadScreen
      headerTitle="Authorize Deposit"
      subtitle="To complete this deposit, enter your transaction PIN"
      value={pin}
      onChange={setPin}
      onComplete={submitDeposit}
      submitting={submitting || authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
