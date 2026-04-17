import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { api, setAccessToken } from './api';
import {
  isRunningOnRealDevice,
  getOrCreateDeviceId,
  getDeviceInfo,
  signChallenge,
} from './device.service';

import type { BvnData, NinData } from '@/types/sign-up.types';
import type {
  AuthTokens,
  ForgotPasswordResponse,
  ForgotPasswordVerifyResponse,
  LoginResponse,
  OtpVerifyResponse,
  PasswordChangeRequestResponse,
  PasswordChangeVerifyResponse,
  PinChangeRequestResponse,
  PinChangeVerifyResponse,
  RegisterPayload,
  RegisterResponse,
} from '@/types/auth.types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function extractErrorMessage(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  throw new Error(fallback);
}

async function storeTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
  setAccessToken(tokens.access_token);
}

export const authService = {
  verifyBvn: async (bvn: string): Promise<BvnData> => {
    try {
      const response = await api.post<BvnData>('/auth/validate/bvn', { bvn });
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'BVN verification failed');
    }
  },

  verifyNin: async (nin: string, bvnVerificationId: string): Promise<NinData> => {
    try {
      const response = await api.post<NinData>('/auth/validate/nin', { nin, bvn_verification_id: bvnVerificationId });
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'NIN verification failed');
    }
  },

  sendPhoneOtp: async (phone: string): Promise<void> => {
    try {
      await api.post('/auth/otp/request', { purpose: 'signup', channel: 'sms', destination: phone });
    } catch (error) {
      extractErrorMessage(error, 'Failed to send OTP');
    }
  },

  verifyPhoneOtp: async (phone: string, otp: string): Promise<OtpVerifyResponse> => {
    try {
      const response = await api.post<OtpVerifyResponse>(
        '/auth/otp/verify',
        { purpose: 'signup', channel: 'sms', destination: phone, otp },
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'OTP verification failed');
    }
  },

  sendEmailOtp: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/otp/request', { purpose: 'signup', channel: 'email', destination: email });
    } catch (error) {
      extractErrorMessage(error, 'Failed to send OTP');
    }
  },

  verifyEmailOtp: async (email: string, otp: string): Promise<OtpVerifyResponse> => {
    try {
      const response = await api.post<OtpVerifyResponse>(
        '/auth/otp/verify',
        { purpose: 'signup', channel: 'email', destination: email, otp },
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'OTP verification failed');
    }
  },

  registerUser: async (
    payload: Omit<RegisterPayload, 'device'>,
  ): Promise<RegisterResponse> => {
    try {
      isRunningOnRealDevice();
      const device = await getDeviceInfo();

      const response = await api.post<RegisterResponse>('/auth/register', {
        ...payload,
        device,
      });

      await storeTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      });
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Registration failed');
    }
  },

  loginUser: async (phone: string, password: string): Promise<LoginResponse> => {
    try {
      isRunningOnRealDevice();
      const deviceId = await getOrCreateDeviceId();

      const response = await api.post<LoginResponse>(
        '/auth/login',
        { phone, password },
        { headers: { 'X-Device-ID': deviceId } },
      );

      const data = response.data;

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
      // if (axios.isAxiosError(error)) {
      //   console.error('Login error status:', error.response?.status);
      //   console.error('Login error data:', JSON.stringify(error.response?.data));
      //   console.error('Login error message:', error.message);
      // } else {
      //   console.error('Login non-axios error:', error);
      // }
      extractErrorMessage(error, 'Login failed');
    }
  },

  verifyDevice: async (
    challenge: string,
    signature: string,
    deviceId: string,
  ): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/device/challenge/verify', {
        challenge,
        signature,
        device_id: deviceId,
      });

      const data = response.data;

      if (data.access_token && data.refresh_token) {
        await storeTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return data;
    } catch (error) {
      extractErrorMessage(error, 'Device verification failed');
    }
  },

  refreshToken: async (): Promise<AuthTokens | null> => {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshTokenValue) return null;

      const deviceId = await getOrCreateDeviceId();
      const response = await api.post<AuthTokens>('/auth/refresh', {
        refresh_token: refreshTokenValue,
        device_id: deviceId,
      });

      await storeTokens(response.data);
      return response.data;
    } catch {
      return null;
    }
  },

  verifyNewDevice: async (otp: string, sessionToken: string): Promise<LoginResponse> => {
    try {
      const device = await getDeviceInfo();
      const response = await api.post<LoginResponse>('/auth/device/otp/verify', {
        device,
        otp,
        session_token: sessionToken,
      });

      const data = response.data;

      if (data.access_token && data.refresh_token) {
        await storeTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return data;
    } catch (error) {
      extractErrorMessage(error, 'Device verification failed');
    }
  },

  resendNewDeviceOtp: async (sessionToken: string): Promise<void> => {
    try {
      const deviceId = await getOrCreateDeviceId();
      await api.post('/auth/device/otp/resend', {
        device_id: deviceId,
        session_token: sessionToken,
      });
    } catch (error) {
      extractErrorMessage(error, 'Failed to resend OTP');
    }
  },

  forgotPassword: async (phone: string): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>('/auth/password/forgot', { phone });
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Failed to send OTP');
    }
  },

  verifyForgotPasswordOtp: async (body: { otp_id: string; otp_code: string }): Promise<ForgotPasswordVerifyResponse> => {
    try {
      const response = await api.post<ForgotPasswordVerifyResponse>('/auth/password/forgot/verify', body);
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'OTP verification failed');
    }
  },

  resendForgotPasswordOtp: async (phone: string): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>('/auth/password/forgot/resend', { phone });
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Failed to resend OTP');
    }
  },

  resetPassword: async (body: {
    phone: string;
    verification_id: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> => {
    try {
      await api.patch('/auth/password/reset', body);
    } catch (error) {
      extractErrorMessage(error, 'Failed to reset password');
    }
  },

  requestPinChange: async (): Promise<PinChangeRequestResponse> => {
    try {
      const response = await api.post<PinChangeRequestResponse>('/auth/pin/change/request');
      return response.data;
    } catch (error) {
      return extractErrorMessage(error, 'Failed to send OTP');
    }
  },

  verifyPinChangeOtp: async (body: { otp_id: string; otp_code: string }): Promise<PinChangeVerifyResponse> => {
    try {
      const response = await api.post<PinChangeVerifyResponse>('/auth/pin/change/verify', body);
      return response.data;
    } catch (error) {
      return extractErrorMessage(error, 'OTP verification failed');
    }
  },

  resendPinChangeOtp: async (): Promise<PinChangeRequestResponse> => {
    try {
      const response = await api.post<PinChangeRequestResponse>('/auth/pin/change/resend');
      return response.data;
    } catch (error) {
      return extractErrorMessage(error, 'Failed to resend OTP');
    }
  },

  changePin: async (body: {
    verification_id: string;
    current_pin: string;
    new_pin: string;
    confirm_new_pin: string;
  }): Promise<void> => {
    try {
      await api.patch('/auth/pin/change', body);
    } catch (error) {
      extractErrorMessage(error, 'Failed to change PIN');
    }
  },

  requestPasswordChange: async (): Promise<PasswordChangeRequestResponse> => {
    try {
      const response = await api.post<PasswordChangeRequestResponse>('/auth/password/change/request');
      return response.data;
    } catch (error) {
      return extractErrorMessage(error, 'Failed to send OTP');
    }
  },

  verifyPasswordChangeOtp: async (body: { otp_id: string; otp_code: string }): Promise<PasswordChangeVerifyResponse> => {
    try {
      const response = await api.post<PasswordChangeVerifyResponse>('/auth/password/change/verify', body);
      return response.data;
    } catch (error) {
      return extractErrorMessage(error, 'OTP verification failed');
    }
  },

  resendPasswordChangeOtp: async (): Promise<PasswordChangeRequestResponse> => {
    try {
      const response = await api.post<PasswordChangeRequestResponse>('/auth/password/change/resend');
      return response.data;
    } catch (error) {
      return extractErrorMessage(error, 'Failed to resend OTP');
    }
  },

  changePassword: async (body: {
    verification_id: string;
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> => {
    try {
      await api.patch('/auth/password/change', body);
    } catch (error) {
      extractErrorMessage(error, 'Failed to change password');
    }
  },

  updateBiometricsPreference: async (enabled: boolean): Promise<void> => {
    try {
      await api.patch('/auth/biometrics/toggle', { is_enabled: enabled });
    } catch (error) {
      extractErrorMessage(error, 'Failed to update biometrics preference');
    }
  },
};
