import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { ApiError, api, setAccessToken, throwApiError } from './api';
import {
  isRunningOnRealDevice,
  getOrCreateDeviceId,
  getDeviceInfo,
  signChallenge,
} from './device.service';

import type { ApiEnvelope } from '@/types/api.types';
import type { BvnData, NinData } from '@/types/sign-up.types';
import type {
  AuthTokens,
  ChallengeRequestResponse,
  ClaimSessionResponse,
  ForgotPasswordResponse,
  ForgotPasswordVerifyResponse,
  ForgotPinResponse,
  ForgotPinVerifyResponse,
  LoginResponse,
  OtpPurpose,
  OtpRequestResponse,
  OtpVerifyResponse,
  PasswordChangeRequestResponse,
  PasswordChangeVerifyResponse,
  PinChangeRequestResponse,
  PinChangeVerifyResponse,
  RegisterJobResponse,
  RegisterPayload,
  RegistrationStatusResponse,
} from '@/types/auth.types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

async function storeTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
  setAccessToken(tokens.access_token);
}

export const authService = {
  verifyBvn: async (bvn: string): Promise<BvnData> => {
    try {
      const response = await api.post<ApiEnvelope<BvnData>>('/auth/validate/bvn', { bvn });
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'BVN verification failed');
    }
  },

  verifyNin: async (nin: string, bvnVerificationId: string): Promise<NinData> => {
    try {
      const response = await api.post<ApiEnvelope<NinData>>(
        '/auth/validate/nin',
        { nin, bvn_verification_id: bvnVerificationId },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'NIN verification failed');
    }
  },

  verifyBvnWithFace: async (
    verificationId: string,
    bvn: string,
    image: string,
  ): Promise<{ bvn_w_face_verification_id: string }> => {
    try {
      const response = await api.post<
        ApiEnvelope<{ bvn_w_face_verification_id: string }>
      >('/auth/validate/bvn-with-face', {
        verification_id: verificationId,
        bvn,
        image,
      });
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'BVN face verification failed');
    }
  },

  verifyNinWithFace: async (
    verificationId: string,
    nin: string,
    image: string,
  ): Promise<{ nin_w_face_verification_id: string }> => {
    try {
      const response = await api.post<
        ApiEnvelope<{ nin_w_face_verification_id: string }>
      >('/auth/validate/nin-with-face', {
        verification_id: verificationId,
        nin,
        image,
      });
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'NIN face verification failed');
    }
  },

  // verificationId is null for submitted_contact requests — the backend
  // identifies those by purpose + destination alone.
  sendPhoneOtp: async (
    verificationId: string | null,
    opts?: { purpose?: OtpPurpose; destination?: string },
  ): Promise<OtpRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<OtpRequestResponse>>(
        '/auth/otp/sms/request',
        {
          ...(verificationId ? { verification_id: verificationId } : {}),
          ...(opts?.purpose ? { purpose: opts.purpose } : {}),
          ...(opts?.destination ? { destination: opts.destination } : {}),
        },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  // Channel-agnostic: both SMS and email OTPs verify the same way, keyed by the
  // otp_id returned from their respective request calls. When a purpose was sent
  // on the request, the same purpose must be sent here or verification fails.
  verifyOtp: async (
    otpId: string,
    otp: string,
    purpose?: OtpPurpose,
  ): Promise<OtpVerifyResponse> => {
    try {
      const response = await api.post<ApiEnvelope<OtpVerifyResponse>>(
        '/auth/otp/verify',
        { otp_id: otpId, otp, ...(purpose ? { purpose } : {}) },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  sendEmailOtp: async (
    verificationId: string,
    opts?: { purpose?: OtpPurpose; destination?: string },
  ): Promise<OtpRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<OtpRequestResponse>>(
        '/auth/otp/email/request',
        {
          verification_id: verificationId,
          ...(opts?.purpose ? { purpose: opts.purpose } : {}),
          ...(opts?.destination ? { destination: opts.destination } : {}),
        },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  registerUser: async (
    payload: Omit<RegisterPayload, 'device'>,
  ): Promise<RegisterJobResponse> => {
    try {
      isRunningOnRealDevice();
      const device = await getDeviceInfo();

      const response = await api.post<ApiEnvelope<RegisterJobResponse>>('/auth/register', {
        ...payload,
        device,
      });

      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Registration failed');
    }
  },

  getRegistrationStatus: async (
    jobId: string,
  ): Promise<RegistrationStatusResponse> => {
    try {
      const response = await api.get<ApiEnvelope<RegistrationStatusResponse>>(
        `/auth/register/${jobId}/status`,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to fetch registration status');
    }
  },

  claimRegistrationSession: async (
    jobId: string,
    claimToken: string,
  ): Promise<ClaimSessionResponse> => {
    try {
      const response = await api.post<ApiEnvelope<ClaimSessionResponse>>(
        `/auth/register/${jobId}/claim`,
        { claim_token: claimToken },
      );
      const data = response.data.data;
      await storeTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return data;
    } catch (error) {
      throwApiError(error, 'Failed to claim session');
    }
  },

  loginUser: async (phone: string, password: string): Promise<LoginResponse> => {
    try {
      isRunningOnRealDevice();
      const deviceId = await getOrCreateDeviceId();

      const response = await api.post<ApiEnvelope<LoginResponse>>(
        '/auth/login',
        { phone, password },
        { headers: { 'X-Device-ID': deviceId } },
      );

      const data = response.data.data;

      if (data.status === 'challenge_required' && data.challenge) {
        let signature: string;
        try {
          signature = await signChallenge(data.challenge);
        } catch {
          throw new Error(
            'Biometric verification was cancelled. Please tap Sign In to try again.',
          );
        }
        return authService.verifyDevice(data.challenge, signature, deviceId);
      }

      if (data.status === 'new_device_detected') {
        return data;
      }

      if (data.status === 'success' && data.access_token && data.refresh_token) {
        await storeTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return data;
    } catch (error) {
      throwApiError(error, 'Login failed. Please, try again');
    }
  },

  requestChallenge: async (): Promise<ChallengeRequestResponse> => {
    const refreshTokenValue = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshTokenValue) {
      throw new Error('No session found. Please sign in with your password.');
    }
    try {
      const response = await api.post<ApiEnvelope<ChallengeRequestResponse>>(
        '/auth/challenge/request',
        { refresh_token: refreshTokenValue },
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // No HTTP response → network/DNS/timeout
        if (!error.response) {
          throw new ApiError(
            "We couldn't reach the server. Please check your connection and try again.",
            'NETWORK_ERROR',
          );
        }
        const status = error.response.status;
        if (status >= 500) {
          throw new ApiError(
            'Service temporarily unavailable. Please try again in a moment.',
            'SERVER_ERROR',
            status,
          );
        }
        const serverError = error.response.data?.error;
        if (serverError && typeof serverError === 'object' && typeof serverError.message === 'string') {
          throw new ApiError(
            serverError.message,
            typeof serverError.code === 'string' ? serverError.code : 'UNKNOWN',
            status,
          );
        }
        throw new ApiError(
          "Couldn't start biometric sign-in. Please sign in with your password.",
          'UNKNOWN',
          status,
        );
      }
      throw new ApiError(
        "Couldn't start biometric sign-in. Please sign in with your password.",
        'UNKNOWN',
      );
    }
  },

  verifyDevice: async (
    challenge: string,
    signature: string,
    deviceId: string,
  ): Promise<LoginResponse> => {
    try {
      const response = await api.post<ApiEnvelope<LoginResponse>>(
        '/auth/device/challenge/verify',
        { challenge, signature, device_id: deviceId },
      );

      const data = response.data.data;

      if (!data.access_token || !data.refresh_token) {
        throw new ApiError('Device verification returned no tokens', 'INVALID_RESPONSE');
      }

      await storeTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      return { ...data, status: 'success' };
    } catch (error) {
      throwApiError(error, 'Device verification failed');
    }
  },

  refreshToken: async (): Promise<AuthTokens | null> => {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshTokenValue) return null;

      const deviceId = await getOrCreateDeviceId();
      const response = await api.post<ApiEnvelope<AuthTokens>>('/auth/refresh', {
        refresh_token: refreshTokenValue,
        device_id: deviceId,
      });

      const tokens = response.data.data;
      await storeTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  },

  verifyNewDevice: async (otp: string, sessionToken: string): Promise<LoginResponse> => {
    try {
      const device = await getDeviceInfo();
      const response = await api.post<ApiEnvelope<LoginResponse>>('/auth/device/otp/verify', {
        device,
        otp,
        session_token: sessionToken,
      });

      const data = response.data.data;

      if (data.access_token && data.refresh_token) {
        await storeTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return data;
    } catch (error) {
      throwApiError(error, 'Device verification failed');
    }
  },

  resendNewDeviceOtp: async (sessionToken: string): Promise<void> => {
    try {
      const deviceId = await getOrCreateDeviceId();
      await api.post<ApiEnvelope>('/auth/device/otp/resend', {
        device_id: deviceId,
        session_token: sessionToken,
      });
    } catch (error) {
      throwApiError(error, 'Failed to resend OTP');
    }
  },

  forgotPassword: async (phone: string): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ApiEnvelope<ForgotPasswordResponse>>(
        '/auth/password/forgot',
        { phone },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  verifyForgotPasswordOtp: async (
    body: { otp_id: string; otp_code: string },
  ): Promise<ForgotPasswordVerifyResponse> => {
    try {
      const response = await api.post<ApiEnvelope<ForgotPasswordVerifyResponse>>(
        '/auth/password/forgot/verify',
        body,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  resendForgotPasswordOtp: async (phone: string): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ApiEnvelope<ForgotPasswordResponse>>(
        '/auth/password/forgot/resend',
        { phone },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to resend OTP');
    }
  },

  resetPassword: async (body: {
    phone: string;
    verification_id: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> => {
    try {
      await api.patch<ApiEnvelope>('/auth/password/reset', body);
    } catch (error) {
      throwApiError(error, 'Failed to reset password');
    }
  },

  requestPinChange: async (): Promise<PinChangeRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<PinChangeRequestResponse>>(
        '/auth/pin/change/request',
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  verifyPinChangeOtp: async (
    body: { otp_id: string; otp_code: string },
  ): Promise<PinChangeVerifyResponse> => {
    try {
      const response = await api.post<ApiEnvelope<PinChangeVerifyResponse>>(
        '/auth/pin/change/verify',
        body,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  resendPinChangeOtp: async (): Promise<PinChangeRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<PinChangeRequestResponse>>(
        '/auth/pin/change/resend',
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to resend OTP');
    }
  },

  changePin: async (body: {
    verification_id: string;
    current_pin: string;
    new_pin: string;
    confirm_new_pin: string;
  }): Promise<void> => {
    try {
      await api.patch<ApiEnvelope>('/auth/pin/change', body);
    } catch (error) {
      throwApiError(error, 'Failed to change PIN');
    }
  },

  forgotPin: async (): Promise<ForgotPinResponse> => {
    try {
      const response = await api.post<ApiEnvelope<ForgotPinResponse>>(
        '/auth/pin/forgot',
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  verifyForgotPinOtp: async (
    body: { otp_id: string; otp_code: string },
  ): Promise<ForgotPinVerifyResponse> => {
    try {
      const response = await api.post<ApiEnvelope<ForgotPinVerifyResponse>>(
        '/auth/pin/forgot/verify',
        body,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  resendForgotPinOtp: async (): Promise<void> => {
    try {
      await api.post<ApiEnvelope>('/auth/pin/forgot/resend');
    } catch (error) {
      throwApiError(error, 'Failed to resend OTP');
    }
  },

  resetPin: async (body: {
    verification_id: string;
    new_pin: string;
    confirm_new_pin: string;
  }): Promise<void> => {
    try {
      await api.patch<ApiEnvelope>('/auth/pin/reset', body);
    } catch (error) {
      throwApiError(error, 'Failed to reset PIN');
    }
  },

  requestPasswordChange: async (): Promise<PasswordChangeRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<PasswordChangeRequestResponse>>(
        '/auth/password/change/request',
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  verifyPasswordChangeOtp: async (
    body: { otp_id: string; otp_code: string },
  ): Promise<PasswordChangeVerifyResponse> => {
    try {
      const response = await api.post<ApiEnvelope<PasswordChangeVerifyResponse>>(
        '/auth/password/change/verify',
        body,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  resendPasswordChangeOtp: async (): Promise<PasswordChangeRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<PasswordChangeRequestResponse>>(
        '/auth/password/change/resend',
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to resend OTP');
    }
  },

  changePassword: async (body: {
    verification_id: string;
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> => {
    try {
      await api.patch<ApiEnvelope>('/auth/password/change', body);
    } catch (error) {
      throwApiError(error, 'Failed to change password');
    }
  },

  logoutUser: async (): Promise<void> => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return;
    try {
      await api.post<ApiEnvelope>('/auth/logout', { refresh_token: refreshToken });
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      throwApiError(error, 'Failed to log out');
    }
  },

  // Wipe the stored tokens locally without calling the backend. Used after an
  // account is closed — its sessions are already revoked server-side, and
  // deleting the SecureStore tokens (which clearAuth intentionally keeps) means
  // the app opens on /welcome rather than the sign-in page next launch.
  clearLocalSession: async (): Promise<void> => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    } catch {
      // best-effort — nothing to recover if SecureStore deletion fails
    }
    setAccessToken(null);
  },

  updateBiometricsPreference: async (enabled: boolean): Promise<void> => {
    try {
      await api.patch<ApiEnvelope>('/auth/biometrics/toggle', { is_enabled: enabled });
    } catch (error) {
      throwApiError(error, 'Failed to update biometrics preference');
    }
  },
};
