import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { QUERY_KEYS } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { walletService } from '@/services/wallet.service';
import { useTransferStore } from '@/stores/transfer.store';
import { getErrorMessage } from '@/utils/error';

export default function TransferPinScreen() {
  const store = useTransferStore();
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  } = useBiometricAuth();

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard: redirect back if the store is empty (direct navigation)
  useEffect(() => {
    if (!store.accountNumber) {
      router.back();
    }
  }, []);

  const parsedAmount = parseInt(store.amount, 10) || 0;

  const submitTransfer = async (transactionPin: string) => {
    // There is no button left to grey out, so the offline check lives here.
    if (isOffline) {
      toast.error('No internet connection', {
        description: 'Reconnect and try again.',
      });
      setPin('');
      return;
    }

    setSubmitting(true);
    try {
      const transfer = await walletService.transfer({
        amount: parsedAmount,
        sort_code: store.bankCode,
        account_number: store.accountNumber,
        narration: store.narration,
        account_name: store.accountName,
        metadata: {},
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      // Outflow consumed — refresh balance and the activation-cap allowance
      // so the next transfer screen pre-validates against fresh numbers.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_LIMITS] });
      store.setTransferResult(transfer);
      setPin('');
      // replace, not push — keeps a screen holding a live PIN out of the back stack.
      router.replace('/(transfer)/transfer-success');
    } catch (err: unknown) {
      toast.error('Transfer failed', { description: getErrorMessage(err) });
      // Clear so the user can retry; a full tray has no way to accept input.
      setPin('');
      // Only cleared on the failure path. On success the screen is already
      // being replaced, and dropping `submitting` there would re-render the
      // tray during teardown — and keep the spinner up through the transition.
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
    submitTransfer(storedPin);
  };

  return (
    <PinKeypadScreen
      value={pin}
      onChange={setPin}
      onComplete={submitTransfer}
      submitting={submitting || authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
