import { router } from 'expo-router';

import { ApiError } from '@/services/api';
import { useSignUpStore } from '@/stores/sign-up.store';

export interface RegisterErrorAction {
  message: string;
  ctaLabel: string;
  recover: () => void;
}

/**
 * Maps the register endpoint's recoverable error codes to a user-facing
 * message plus a recovery action that clears the stale verification state
 * before navigating — resubmitting the same dead verification ids would
 * just fail again. Returns null for unrecognized errors so callers keep
 * their generic fallback.
 */
export function getRegisterErrorAction(err: unknown): RegisterErrorAction | null {
  if (!(err instanceof ApiError)) return null;

  // Email-first users chose email because they can't receive SMS on their BVN
  // phone — resetting them to the SMS path would point the recovery at a dead
  // number. Keep their channel and send them back to the email OTP instead.
  const contactVerificationAction = (message: string): RegisterErrorAction => {
    const emailFirst = useSignUpStore.getState().primaryOtpChannel === 'email';

    const clearContactVerification = () => {
      const s = useSignUpStore.getState();
      s.setOtpVerificationId('');
      s.setPhoneOtpId('');
      s.setEmailOtpId('');
      // The optional email verification shares the same 15-min TTL, so if the
      // contact verification expired this one has too — keep it and the next
      // register attempt fails EMAIL_NOT_FOUND after redoing the whole flow.
      s.setEmailVerificationId('');
      if (emailFirst) {
        // Keep submittedPhone so the alternate-phone field comes back
        // prefilled; its verification shares the same expired TTL.
        s.setSubmittedPhoneOtpId('');
        s.setSubmittedPhoneVerificationId('');
      } else {
        s.clearSubmittedPhone();
        s.setPrimaryOtpChannel('sms');
      }
    };

    return {
      message,
      ctaLabel: emailFirst ? 'Verify email' : 'Verify phone',
      recover: () => {
        clearContactVerification();
        if (emailFirst) {
          router.replace({
            pathname: '/(sign-up)/phone-otp',
            params: { channel: 'email' },
          });
        } else {
          router.replace('/(sign-up)/phone-validation');
        }
      },
    };
  };

  switch (err.code) {
    case 'INVALID_VERIFICATION_TYPE':
      return contactVerificationAction(
        'Something went wrong with your contact verification. Please verify again.',
      );
    case 'PHONE_OR_EMAIL_NOT_FOUND':
      return contactVerificationAction(
        'Your contact verification has expired. Please verify again — it only takes a minute.',
      );
    case 'EMAIL_NOT_FOUND':
      return {
        message:
          'Your email verification has expired. Please verify your email again, or skip it.',
        ctaLabel: 'Verify email',
        recover: () => {
          // Keep the typed email so the field comes back prefilled.
          useSignUpStore.getState().setEmailVerificationId('');
          router.replace('/(sign-up)/email-validation');
        },
      };
    case 'NIN_BVN_MISMATCH':
      return {
        message:
          "The details on your BVN and NIN don't match. Please restart sign-up and double-check both numbers.",
        ctaLabel: 'Restart sign-up',
        recover: () => {
          useSignUpStore.getState().reset();
          router.replace('/(sign-up)/bvn-verification');
        },
      };
    default:
      return null;
  }
}
