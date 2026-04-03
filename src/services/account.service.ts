import type {
  AccountSummary,
  AccountSummaryResponse,
} from '@/types/account.types';
import { api } from './api';

export const accountService = {
  getSummary: async (): Promise<AccountSummary> => {
    const { data } = await api.get<AccountSummaryResponse>('/account/summary');
    return data.data;
  },
};
