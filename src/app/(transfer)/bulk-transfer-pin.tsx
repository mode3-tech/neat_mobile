import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { refreshAfterMoneyMovement } from '@/utils/money-movement-refresh';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { walletService } from '@/services/wallet.service';
import { useBulkTransferStore } from '@/stores/bulk-transfer.store';
import { getErrorMessage } from '@/utils/error';

export default function BulkTransferPinScreen() {
  const { recipients, setResultMessage } = useBulkTransferStore();
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

  useEffect(() => {
    if (recipients.length === 0) router.back();
  }, []);

  const submitBulk = async (transactionPin: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const response = await walletService.transferBulk({
        recipient_info: recipients.map((r) => ({
          amount: r.amount,
          sort_code: r.sort_code,
          narration: r.narration || 'Bulk payment',
          account_number: r.account_number,
          account_name: r.account_name,
          metadata: {},
        })),
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      // Drops the activation-cap allowance too, so the next transfer screen
      // pre-validates against fresh numbers.
      refreshAfterMoneyMovement(queryClient);
      setResultMessage(
        response.message || 'Your bulk transfer has been processed successfully.',
      );
      setPin('');
      router.replace('/(transfer)/bulk-transfer-success');
    } catch (err: unknown) {
      toast.error('Bulk transfer failed', { description: getErrorMessage(err) });
      // Clear so the user can retry; a full tray has no way to accept input.
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
    submitBulk(storedPin);
  };

  return (
    <PinKeypadScreen
      subtitle="To complete this bulk transfer, enter your transaction PIN"
      value={pin}
      onChange={setPin}
      onComplete={submitBulk}
      submitting={submitting}
      disabled={authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
