import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { QUERY_KEYS } from '@/constants';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { getErrorMessage } from '@/utils/error';

export default function VasPinScreen() {
  const params = useLocalSearchParams<{
    provider: string;
    phone: string;
    plan?: string;
    smartcard?: string;
    packageName?: string;
    months?: string;
    meter?: string;
    meterType?: string;
    amount: string;
    date: string;
  }>();

  const queryClient = useQueryClient();

  const categoryName = useVasStore((s) => s.categoryName);
  const biller = useVasStore((s) => s.biller);
  const product = useVasStore((s) => s.product);
  const phoneNumber = useVasStore((s) => s.phoneNumber);
  const amount = useVasStore((s) => s.amount);
  const smartcardNumber = useVasStore((s) => s.smartcardNumber);
  const noOfMonth = useVasStore((s) => s.noOfMonth);
  const meterNumber = useVasStore((s) => s.meterNumber);
  const accountType = useVasStore((s) => s.accountType);

  const isData = categoryName === 'DATA';
  const isCable = categoryName === 'CABLE TV';
  const isElectricity = categoryName === 'ELECTRICITY';

  const {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  } = useBiometricAuth();

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goToResult = (
    status: 'success' | 'failed',
    message: string,
    extra?: { token?: string; units?: string },
  ) => {
    router.push({
      pathname: '/(vas)/airtime-result',
      params: {
        status,
        message,
        provider: params.provider ?? '',
        phone: params.phone ?? '',
        plan: params.plan ?? '',
        smartcard: params.smartcard ?? '',
        packageName: params.packageName ?? '',
        months: params.months ?? '',
        meter: params.meter ?? '',
        meterType: params.meterType ?? '',
        token: extra?.token ?? '',
        units: extra?.units ?? '',
        amount: params.amount ?? '',
        date: params.date ?? '',
      },
    });
  };

  // Data, cable and electricity purchases surface errors here so the user can
  // retry their PIN; airtime keeps routing failures to the shared result screen.
  const handleFailure = (message: string) => {
    // Either way the PIN is cleared: the pad auto-submits on the 4th digit, so
    // a tray left full has no way to accept a retry.
    setPin('');
    if (isData || isCable || isElectricity) {
      const title = isCable
        ? 'Cable subscription failed'
        : isElectricity
          ? 'Electricity payment failed'
          : 'Data purchase failed';
      toast.error(title, { description: message });
      return;
    }
    goToResult('failed', message);
  };

  const purchase = async (transactionPin: string) => {
    if (!product || (isCable && !biller)) return;
    setSubmitting(true);
    try {
      let message: string;
      let token: string | undefined;
      let units: string | undefined;
      if (isCable) {
        ({ message } = await vasService.buyCable({
          pin: transactionPin,
          unique_code: product.unique_code,
          account_number: smartcardNumber,
          account_type: biller!.biller_code,
          no_of_month: noOfMonth,
          amount: Number(amount),
        }));
      } else if (isElectricity) {
        const res = await vasService.buyElectricity({
          pin: transactionPin,
          unique_code: product.unique_code,
          account_number: meterNumber,
          account_type: accountType,
          amount: Number(amount),
        });
        message = res.message;
        token = res.token;
        units = res.unit;
      } else {
        const payload = {
          pin: transactionPin,
          unique_code: product.unique_code,
          phone_number: phoneNumber,
          amount: Number(amount),
        };
        ({ message } = isData
          ? await vasService.buyData(payload)
          : await vasService.buyAirtime(payload));
      }
      await onManualPinSuccess(transactionPin);
      // Refresh the cached balance so the next VAS/transfer screen gates on the
      // post-debit balance instead of a stale one.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      // Clear the PIN so backing out of the result screen can't re-confirm
      // the purchase with a still-armed PIN.
      setPin('');
      goToResult('success', message, { token, units });
    } catch (err: unknown) {
      handleFailure(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometric = async () => {
    if (authenticating || submitting) return;
    const storedPin = await authenticateWithBiometric();
    if (!storedPin) {
      // No purchase was attempted, so this is not a transaction failure —
      // keep any typed PIN and let the user continue manually.
      toast.error('Biometric authentication failed', {
        description: 'Please use your PIN instead.',
      });
      return;
    }
    purchase(storedPin);
  };

  return (
    <PinKeypadScreen
      headerTitle="Authorize Payment"
      subtitle="To complete this purchase, enter your transaction PIN"
      value={pin}
      onChange={setPin}
      onComplete={purchase}
      submitting={submitting || authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
