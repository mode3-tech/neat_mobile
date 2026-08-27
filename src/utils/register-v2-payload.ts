import { useSignUpV2Store } from '@/stores/sign-up-v2.store';

import type { V2RegisterPayload } from '@/types/sign-up-v2.types';

/**
 * Builds the v2 /register body from the v2 store.
 *
 * Everything except `referral_code` is required by the backend, so unlike v1's
 * builder there is almost nothing conditional here — and in particular
 * `is_biometrics_enabled` must always be present as a real boolean, never
 * spread-omitted.
 */
export function buildV2RegisterPayload(): Omit<V2RegisterPayload, 'device'> {
  const s = useSignUpV2Store.getState();
  return {
    first_name: s.firstName.trim(),
    last_name: s.lastName.trim(),
    dob: s.dob,
    email: s.email.trim(),
    email_verification_id: s.emailVerificationId,
    gender: s.gender.trim(),
    marital_status: s.maritalStatus.trim(),
    mothers_maiden_name: s.mothersMaidenName.trim(),
    address: s.address.trim(),
    house_no: s.houseNo.trim(),
    phone_number: s.phone.trim(),
    phone_verification_id: s.phoneVerificationId,
    bvn: s.bvn,
    nin: s.nin,
    password: s.password,
    confirm_password: s.password,
    transaction_pin: s.transactionPin,
    confirm_transaction_pin: s.transactionPin,
    is_biometrics_enabled: s.biometricsEnabled,
    ...(s.redeemCode.trim() ? { referral_code: s.redeemCode.trim() } : {}),
  };
}
