import type { DeviceInfo } from './device.types';

/**
 * Request/response shapes for the v2 registration endpoints
 * (`{host}/api/v2/auth/...`, tagged "Registration v2" in the OpenAPI spec at
 * /openapi/doc.json — note /swagger/doc.json currently 500s).
 *
 * Responses use the same ApiEnvelope as v1, so these types describe the inner
 * `data` object only.
 */

export interface V2OtpRequestResponse {
  otp_id: string;
}

/**
 * Shared response DTO for /otp/phone/verify, /otp/email/verify and
 * /validate/bvn. All three return the same three fields, but only the BVN
 * response's `requires_otp` means anything to the client — see the comment on
 * requires_otp below.
 */
export interface V2VerificationResponse {
  verification_id: string;
  /** Optimus reference for the provider OTP step. Empty under Providus. */
  provider_reference_id: string;
  /**
   * Whether a provider OTP step is required. Meaningful ONLY on the
   * /validate/bvn response — the phone and email verify endpoints return it
   * because they share this DTO, not because it applies to them.
   */
  requires_otp: boolean;
}

export interface V2ResendOtpResponse {
  /**
   * A NEW reference. The old one is dead after a resend, so this must
   * overwrite the stored providerReferenceId or the next /otp/verify fails.
   */
  reference_id: string;
}

export interface V2BvnValidationPayload {
  bvn: string;
  /** ISO date, `YYYY-MM-DD`. */
  dob: string;
  email: string;
  referral_code?: string;
}

export interface V2VerifyProviderOtpPayload {
  phone_no: string;
  otp_token: string;
  email: string;
  reference_id: string;
}

/**
 * Body for POST /v2/auth/register. Everything except `referral_code` is
 * required by the backend.
 *
 * Note what is NOT here: no bvn_verification_id, no nin_verification_id, no
 * face verification ids. v2 sends the raw `bvn` and `nin` and does its own
 * server-side validation — the verification_id from /validate/bvn is not used
 * by the client at all.
 */
export interface V2RegisterPayload {
  first_name: string;
  last_name: string;
  /** ISO date, `YYYY-MM-DD`. */
  dob: string;
  email: string;
  email_verification_id: string;
  /** Free string — the backend does not constrain this to an enum. */
  gender: string;
  /** Free string — the backend does not constrain this to an enum. */
  marital_status: string;
  mothers_maiden_name: string;
  address: string;
  house_no: string;
  phone_number: string;
  phone_verification_id: string;
  bvn: string;
  nin: string;
  password: string;
  confirm_password: string;
  transaction_pin: string;
  confirm_transaction_pin: string;
  /** Required and non-nullable server-side — never omit, always send a bool. */
  is_biometrics_enabled: boolean;
  referral_code?: string;
  device: DeviceInfo;
}

/** v2 register is synchronous — tokens come straight back, no job to claim. */
export interface V2RegisterResponse {
  access_token: string;
  refresh_token: string;
}
