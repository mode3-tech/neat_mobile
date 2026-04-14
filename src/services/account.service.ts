import type {
  AccountSummary,
  AccountSummaryResponse,
  StatementJobStatusResponse,
  StatementRequestBody,
  StatementRequestResponse,
} from '@/types/account.types';
import { api } from './api';

export const accountService = {
  getSummary: async (): Promise<AccountSummary> => {
    const { data } = await api.get<AccountSummaryResponse>('/account/summary');
    return data.data;
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
