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

export interface RegisterPayload {
  phone_number: string;
  email: string;
  password: string;
  confirm_password: string;
  transaction_pin: string;
  confirm_transaction_pin: string;
  bvn_verification_id: string;
  nin_verification_id: string;
  phone_verification_id: string;
  email_verification_id: string;
  is_biometrics_enabled: boolean;
  device: DeviceInfo;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  message: string;
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
