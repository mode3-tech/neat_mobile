import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { QUERY_KEYS } from '@/constants';
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

  useEffect(() => {
    if (recipients.length === 0) router.back();
  }, []);

  const submitBulk = async (transactionPin: string) => {
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
      // Outflow consumed — refresh balance and the activation-cap allowance
      // so the next transfer screen pre-validates against fresh numbers.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_LIMITS] });
      setResultMessage(
        response.message || 'Your bulk transfer has been processed successfully.',
      );
      setPin('');
      router.replace('/(transfer)/bulk-transfer-success');
    } catch (err: unknown) {
      toast.error('Bulk transfer failed', { description: getErrorMessage(err) });
      // Clear so the user can retry; a full tray has no way to accept input.
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
    submitBulk(storedPin);
  };

  return (
    <PinKeypadScreen
      subtitle="To complete this bulk transfer, enter your transaction PIN"
      value={pin}
      onChange={setPin}
      onComplete={submitBulk}
      submitting={submitting || authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
