import type {
  AccountSummary,
  AccountSummaryResponse,
  StatementJobStatusResponse,
  StatementRequestBody,
  StatementRequestResponse,
  UpdateProfileBody,
} from '@/types/account.types';
import { api, getAccessToken } from './api';
import { getOrCreateDeviceId } from './device.service';

export const accountService = {
  getSummary: async (): Promise<AccountSummary> => {
    const { data } = await api.get<AccountSummaryResponse>('/account/summary');
    return data.data;
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
      throw new Error('Network error. Please check your connection.');
    }

    if (!response.ok) {
      let serverMessage: string | undefined;
      try {
        const data = await response.json();
        serverMessage = data?.error;
      } catch {
        // response wasn't json — fall through to generic message
      }
      throw new Error(serverMessage ?? 'Failed to update profile');
    }
  },

  requestStatement: async (
    body: StatementRequestBody,
  ): Promise<StatementRequestResponse> => {
    const { data } = await api.post<StatementRequestResponse>(
      '/account/statement',
      body,
    );
    return data;
  },

  getStatementJobStatus: async (
    jobId: string,
  ): Promise<StatementJobStatusResponse> => {
    const { data } = await api.get<StatementJobStatusResponse>(
      `/account/statement/${encodeURIComponent(jobId)}/status`,
    );
    return data;
  },
};
