import { useState } from 'react';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { PinKeypadScreen } from '@/components/ui/pin-keypad-screen';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { loanService } from '@/services/loan.service';
import { useLoanStore } from '@/stores/loan.store';
import { getErrorMessage } from '@/utils/error';

export default function LoanPinScreen() {
  const store = useLoanStore();
  const {
    isBiometricReady,
    biometryType,
    authenticating,
    authenticateWithBiometric,
    onManualPinSuccess,
  } = useBiometricAuth();

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitApplication = async (transactionPin: string) => {
    setSubmitting(true);
    try {
      const response = await loanService.submitApplication({
        business_address: store.businessAddress,
        business_start_date: store.businessAge,
        business_value: store.businessValue,
        loan_amount: store.loanAmount,
        loan_product_type: store.loanProductCode,
        transaction_pin: transactionPin,
      });

      await onManualPinSuccess(transactionPin);
      store.setSummary(response.summary);
      store.setApplicationRef(response.application_ref);
      // Clear before navigating so backing out of the success screen can't
      // re-submit with a still-armed PIN.
      setPin('');
      router.push('/(loan)/loan-success');
    } catch (err: unknown) {
      toast.error('Application failed', { description: getErrorMessage(err) });
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
    submitApplication(storedPin);
  };

  return (
    <PinKeypadScreen
      headerTitle="Authorize Application"
      subtitle="To submit this loan application, enter your transaction PIN"
      value={pin}
      onChange={setPin}
      onComplete={submitApplication}
      submitting={submitting || authenticating}
      onBiometric={isBiometricReady ? handleBiometric : undefined}
      biometryType={biometryType}
    />
  );
}
