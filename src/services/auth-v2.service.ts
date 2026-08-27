import { API_V2_ROOT } from '@/constants/signup-version';

import { api, throwApiError } from './api';
import { storeTokens } from './auth.service';
import { getDeviceInfo, isRunningOnRealDevice } from './device.service';

import type { ApiEnvelope } from '@/types/api.types';
import type {
  V2BvnValidationPayload,
  V2OtpRequestResponse,
  V2RegisterPayload,
  V2RegisterResponse,
  V2ResendOtpResponse,
  V2VerificationResponse,
  V2VerifyProviderOtpPayload,
} from '@/types/sign-up-v2.types';

/**
 * The v2 registration endpoints.
 *
 * These live on a different base (`{host}/api/v2/auth/...`) than the rest of
 * the app, so every call passes an ABSOLUTE url — axios uses it verbatim and
 * ignores the instance's /api/v1 baseURL. Same trick version.service.ts uses
 * for /app/version, and the reason there is no second axios instance here: the
 * shared one already attaches X-Device-ID and X-Device-Integrity, handles 401
 * refresh, and produces ApiError via throwApiError. A parallel instance would
 * have to duplicate all of that and would drift.
 *
 * The response envelope is identical to v1's, so `response.data.data` unwraps
 * the same way.
 */

const v2 = (path: string) => `${API_V2_ROOT}/auth${path}`;

export const authV2Service = {
  requestPhoneOtp: async (phoneNumber: string): Promise<V2OtpRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<V2OtpRequestResponse>>(
        v2('/otp/phone/request'),
        { phone_number: phoneNumber },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  // NOTE: the field is `code`, not `otp`. v1's /auth/otp/verify uses `otp`;
  // sending that here fails as INVALID_REQUEST_BODY.
  verifyPhoneOtp: async (
    otpId: string,
    code: string,
  ): Promise<V2VerificationResponse> => {
    try {
      const response = await api.post<ApiEnvelope<V2VerificationResponse>>(
        v2('/otp/phone/verify'),
        { otp_id: otpId, code },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  requestEmailOtp: async (email: string): Promise<V2OtpRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<V2OtpRequestResponse>>(
        v2('/otp/email/request'),
        { email },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to send OTP');
    }
  },

  verifyEmailOtp: async (
    otpId: string,
    code: string,
  ): Promise<V2VerificationResponse> => {
    try {
      const response = await api.post<ApiEnvelope<V2VerificationResponse>>(
        v2('/otp/email/verify'),
        { otp_id: otpId, code },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  /**
   * `requires_otp` on this response is the ONE place the wallet provider
   * surfaces to the client: false under Providus (nothing more to do), true
   * under Optimus (a provider OTP step follows, keyed by
   * provider_reference_id). The client never picks a provider itself.
   *
   * The `verification_id` it returns is deliberately not stored anywhere —
   * v2's register takes the raw bvn instead.
   */
  validateBvn: async (
    payload: V2BvnValidationPayload,
  ): Promise<V2VerificationResponse> => {
    try {
      const response = await api.post<ApiEnvelope<V2VerificationResponse>>(
        v2('/validate/bvn'),
        payload,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'BVN validation failed');
    }
  },

  /** Only reachable when validateBvn returned requires_otp: true. */
  verifyProviderOtp: async (
    payload: V2VerifyProviderOtpPayload,
  ): Promise<void> => {
    try {
      await api.post<ApiEnvelope>(v2('/otp/verify'), payload);
    } catch (error) {
      throwApiError(error, 'OTP verification failed');
    }
  },

  /**
   * Returns a NEW reference_id — the caller must write it back to the store.
   * The previous reference is dead once this succeeds, so verifying against it
   * afterwards fails.
   */
  resendProviderOtp: async (
    referenceId: string,
  ): Promise<V2ResendOtpResponse> => {
    try {
      const response = await api.post<ApiEnvelope<V2ResendOtpResponse>>(
        v2('/otp/resend'),
        { reference_id: referenceId },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to resend OTP');
    }
  },

  /**
   * Synchronous, unlike v1: this returns the session tokens directly. There is
   * no job to poll and no claim step, so there is no v2 equivalent of
   * registration-processing.tsx.
   */
  register: async (
    payload: Omit<V2RegisterPayload, 'device'>,
  ): Promise<V2RegisterResponse> => {
    try {
      isRunningOnRealDevice();
      const device = await getDeviceInfo();

      const response = await api.post<ApiEnvelope<V2RegisterResponse>>(
        v2('/register'),
        { ...payload, device },
      );

      const data = response.data.data;
      await storeTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return data;
    } catch (error) {
      throwApiError(error, 'Registration failed');
    }
  },
};
