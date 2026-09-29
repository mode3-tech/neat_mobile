import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { refreshAfterMoneyMovement } from '@/utils/money-movement-refresh';
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
  // Synchronous re-entry guard; `submitting` only updates on the next render.
  const inFlight = useRef(false);

  const submitDeposit = async (transactionPin: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      await savingsService.deposit({
        amount: parseFloat(store.amount),
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      refreshAfterMoneyMovement(queryClient);
      setPin('');
      store.reset();
      router.replace('/Dashboard');
    } catch (err: unknown) {
      toast.error('Deposit failed', { description: getErrorMessage(err) });
      // Clear so the user can retry — the pad auto-submits on the 4th digit,
      // so a tray left full has no way to accept input.
      setPin('');
      // Failure path only: on success the screen is already being replaced,
      // and re-rendering the tray during teardown can crash Fabric.
      inFlight.current = false;
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
      submitting={submitting}
      disabled={authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
