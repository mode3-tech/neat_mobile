import type {
  AccountLimits,
  AccountSummary,
  StatementJobStatusResponse,
  StatementRequestBody,
  StatementRequestResponse,
  UpdateProfileBody,
} from '@/types/account.types';
import type { ApiEnvelope } from '@/types/api.types';
import { ApiError, api, getAccessToken, throwApiError } from './api';
import { getOrCreateDeviceId } from './device.service';

export const accountService = {
  getSummary: async (): Promise<AccountSummary> => {
    try {
      const response = await api.get<ApiEnvelope<AccountSummary>>('/account/summary');
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load account summary');
    }
  },

  getLimits: async (): Promise<AccountLimits> => {
    try {
      const response = await api.get<ApiEnvelope<AccountLimits>>('/account/limits');
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load account limits');
    }
  },

  updateProfile: async (body: UpdateProfileBody): Promise<void> => {
    // RN + axios v1 cannot reliably send multipart FormData (the boundary
    // never makes it into the Content-Type header). Use fetch directly —
    // RN's native fetch handles FormData correctly.
    const form = new FormData();
    if (body.email !== undefined) form.append('email', body.email);
    if (body.address !== undefined) form.append('address', body.address);
    if (body.profile_picture_uri) {
      const uri = body.profile_picture_uri;
      const name = uri.split('/').pop() ?? 'profile.jpg';
      const ext = name.split('.').pop()?.toLowerCase();
      const mime =
        ext === 'png' ? 'image/png' :
        ext === 'heic' ? 'image/heic' :
        'image/jpeg';
      form.append('profile_picture', { uri, name, type: mime } as any);
    }

    const baseUrl = process.env.EXPO_PUBLIC_API_URL!;
    const accessToken = getAccessToken();
    const deviceId = await getOrCreateDeviceId();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Device-ID': deviceId,
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/account/profile`, {
        method: 'PATCH',
        headers,
        body: form,
      });
    } catch {
      throw new ApiError('Network error. Please check your connection.', 'NETWORK_ERROR');
    }

    if (!response.ok) {
      let serverError: { code?: string; message?: string } | undefined;
      try {
        const data = await response.json();
        if (data?.error && typeof data.error === 'object') {
          serverError = data.error;
        }
      } catch {
        // response wasn't json — fall through to generic message
      }
      throw new ApiError(
        serverError?.message ?? 'Failed to update profile',
        serverError?.code ?? 'UNKNOWN',
        response.status,
      );
    }
  },

  requestStatement: async (
    body: StatementRequestBody,
  ): Promise<StatementRequestResponse> => {
    try {
      const response = await api.post<ApiEnvelope<StatementRequestResponse>>(
        '/account/statement',
        body,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to request statement');
    }
  },

  getStatementJobStatus: async (
    jobId: string,
  ): Promise<StatementJobStatusResponse> => {
    try {
      const response = await api.get<ApiEnvelope<StatementJobStatusResponse>>(
        `/account/statement/${encodeURIComponent(jobId)}/status`,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to fetch statement status');
    }
  },
};
