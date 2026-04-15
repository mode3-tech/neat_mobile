import axios from 'axios';

import type {
  AccountSummary,
  AccountSummaryResponse,
  StatementJobStatusResponse,
  StatementRequestBody,
  StatementRequestResponse,
  UpdateProfileBody,
} from '@/types/account.types';
import { api } from './api';

function extractErrorMessage(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  throw new Error(fallback);
}

export const accountService = {
  getSummary: async (): Promise<AccountSummary> => {
    const { data } = await api.get<AccountSummaryResponse>('/account/summary');
    return data.data;
  },

  updateProfile: async (body: UpdateProfileBody): Promise<void> => {
    try {
      await api.patch('/account/profile', body);
    } catch (error) {
      extractErrorMessage(error, 'Failed to update profile');
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
