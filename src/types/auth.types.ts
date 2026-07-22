import type { DeviceInfo } from './device.types';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
}

export type OtpPurpose = 'signup' | 'submitted_contact';

export interface RegisterPayload {
  password: string;
  confirm_password: string;
  transaction_pin: string;
  confirm_transaction_pin: string;
  bvn_verification_id: string;
  bvn_w_face_verification_id: string;
  nin_verification_id: string;
  nin_w_face_verification_id: string;
  /** verification_id from the primary signup OTP, whichever channel delivered it. */
  otp_verification_id: string;
  /** Required when the primary OTP was email (lost-BVN-phone flow); omit for phone-first. */
  submitted_phone_verification_id?: string;
  /** Omit entirely when the optional email step was skipped — '' is rejected. */
  email_verification_id?: string;
  is_biometrics_enabled: boolean;
  /** Optional referral code — omitted entirely when the user leaves it blank. */
  referral_code?: string;
  device: DeviceInfo;
}

export interface RegisterJobResponse {
  job_id: string;
  claim_token: string;
  claim_expires_at: string;
}

export type RegistrationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface RegistrationStatusResponse {
  job_id: string;
  registration_status: RegistrationStatus;
  message: string;
  can_login: boolean;
  can_claim_session: boolean;
  claim_expires_at: string;
  error?: string;
}

export interface ClaimSessionResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  status: 'success' | 'challenge_required' | 'new_device_detected';
  user?: AuthUser;
  access_token?: string;
  refresh_token?: string;
  challenge?: string;
  session_token?: string;
  is_biometrics_enabled?: boolean;
}

export interface VerifyDevicePayload {
  challenge: string;
  signature: string;
  device_id: string;
}

export interface ChallengeRequestResponse {
  challenge: string;
  expires_at: string;
}

export interface OtpRequestResponse {
  otp_id: string;
  /** Optional server-provided cooldown (seconds) before another code can be sent. */
  retry_after?: number;
}

export interface OtpVerifyResponse {
  message: string;
  verification_id: string;
}

export interface VerifyNewDevicePayload {
  device: DeviceInfo;
  otp: string;
  session_token: string;
}

export interface ResendNewDeviceOtpPayload {
  device_id: string;
  session_token: string;
}

export interface PinChangeRequestResponse {
  otp_id: string;
}

export interface PinChangeVerifyResponse {
  verification_id: string;
}

export interface PasswordChangeRequestResponse {
  otp_id: string;
}

export interface PasswordChangeVerifyResponse {
  verification_id: string;
}

export interface ForgotPinResponse {
  otp_id: string;
}

export interface ForgotPinVerifyResponse {
  verification_id: string;
}

export interface ForgotPasswordResponse {
  message: string;
  otp_id: string;
}

export interface ForgotPasswordVerifyResponse {
  message: string;
  verification_id: string;
}
