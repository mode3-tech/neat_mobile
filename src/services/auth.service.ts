import axios from 'axios';

import { api } from './api';

import type { ApiResponse } from '@/types/api.types';
import type { AuthTokens, AuthUser, LoginPayload, LoginResponse } from '@/types/auth.types';
import type { BvnData, NinData, SignUpPayload } from '@/types/sign-up.types';

function extractErrorMessage(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  throw new Error(fallback);
}

export const authService = {
  verifyBvn: async (bvn: string): Promise<BvnData> => {
    try {
      const response = await api.post<BvnData>('/auth/validate-bvn', { bvn });
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'BVN verification failed');
    }
  },

  verifyNin: async (nin: string): Promise<NinData> => {
    try {
      const response = await api.post<NinData>('/auth/validate-nin', { nin });
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

  verifyPhoneOtp: async (phone: string, otp: string): Promise<void> => {
    try {
      await api.post('/auth/otp/verify', { purpose: 'signup', channel: 'sms', destination: phone, otp });
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

  verifyEmailOtp: async (email: string, otp: string): Promise<void> => {
    try {
      await api.post('/auth/otp/verify', { purpose: 'signup', channel: 'email', destination: email, otp });
    } catch (error) {
      extractErrorMessage(error, 'OTP verification failed');
    }
  },

  register: async (payload: SignUpPayload): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
    try {
      const response = await api.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>('/auth/register', payload);
      return response.data.data;
    } catch (error) {
      extractErrorMessage(error, 'Registration failed');
    }
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', payload);
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Login failed');
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/otp/request', { purpose: 'reset-password', channel: 'email', destination: email });
    } catch (error) {
      extractErrorMessage(error, 'Failed to send OTP');
    }
  },

  verifyForgotPasswordOtp: async (email: string, otp: string): Promise<void> => {
    try {
      await api.post('/auth/otp/verify', { purpose: 'reset-password', channel: 'email', destination: email, otp });
    } catch (error) {
      extractErrorMessage(error, 'OTP verification failed');
    }
  },
};
