import { useEffect } from 'react';
import { Platform } from 'react-native';

type UseSmsOtpOptions = {
  onOtpReceived: (otp: string) => void;
  otpLength?: number;
};

export function useSmsOtp({ onOtpReceived, otpLength = 6 }: UseSmsOtpOptions) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let cleanup: (() => void) | undefined;

    try {
      const {
        startSmsHandling,
        retrieveVerificationCode,
      } = require('@eabdullazyanov/react-native-sms-user-consent');

      cleanup = startSmsHandling((event: { sms?: string }) => {
        if (!event?.sms) return;
        const code = retrieveVerificationCode(event.sms, otpLength);
        if (code) {
          onOtpReceived(code);
        }
      });
    } catch {
      // Library not available (e.g. Expo Go)
    }

    return () => {
      cleanup?.();
    };
  }, [onOtpReceived, otpLength]);
}
