import type {
  Transaction,
  PaginatedTransactionsResponse,
} from '@/types/transaction.types';
import type { ApiEnvelope } from '@/types/api.types';
import { api, throwApiError } from './api';

export const transactionService = {
  getRecent: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get<ApiEnvelope<Transaction[]>>(
        '/transaction/recent',
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load recent transactions');
    }
  },

  getAll: async (params: {
    limit: number;
    cursor?: string;
  }): Promise<PaginatedTransactionsResponse> => {
    try {
      const response = await api.get<ApiEnvelope<PaginatedTransactionsResponse>>(
        '/transaction/all',
        {
          params: {
            limit: params.limit,
            ...(params.cursor ? { cursor: params.cursor } : {}),
          },
        },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load transactions');
    }
  },
};
