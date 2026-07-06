import { useSignUpStore } from '@/stores/sign-up.store';

import type { RegisterPayload } from '@/types/auth.types';

/**
 * Builds the /auth/register body from the sign-up store. Shared by the
 * enable-biometrics submit and the registration-processing retry so the
 * payload shape can't drift between them.
 *
 * Conditional fields are omitted (not sent empty): the backend rejects
 * `email_verification_id: ''`, and `submitted_phone_verification_id` only
 * applies when the primary signup OTP was delivered by email.
 */
export function buildRegisterPayload(): Omit<RegisterPayload, 'device'> {
  const s = useSignUpStore.getState();
  return {
    password: s.password,
    confirm_password: s.password,
    transaction_pin: s.transactionPin,
    confirm_transaction_pin: s.transactionPin,
    bvn_verification_id: s.bvnData?.verification_id ?? '',
    bvn_w_face_verification_id: s.bvnFaceVerificationId,
    nin_verification_id: s.ninData?.verification_id ?? '',
    nin_w_face_verification_id: s.ninFaceVerificationId,
    otp_verification_id: s.otpVerificationId,
    ...(s.primaryOtpChannel === 'email' && s.submittedPhoneVerificationId
      ? { submitted_phone_verification_id: s.submittedPhoneVerificationId }
      : {}),
    ...(s.emailVerificationId
      ? { email_verification_id: s.emailVerificationId }
      : {}),
    is_biometrics_enabled: s.biometricsEnabled,
  };
}
