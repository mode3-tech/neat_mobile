import type {
  Transaction,
  RecentTransactionsResponse,
  PaginatedTransactionsResponse,
} from '@/types/transaction.types';
import { api } from './api';

export const transactionService = {
  getRecent: async (): Promise<Transaction[]> => {
    const { data } = await api.get<RecentTransactionsResponse>(
      '/transaction/recent',
    );
    return data.transactions;
  },

  getAll: async (params: {
    limit: number;
    cursor?: string;
  }): Promise<PaginatedTransactionsResponse> => {
    const { data } = await api.get<PaginatedTransactionsResponse>(
      '/transaction/all',
      {
        params: {
          limit: params.limit,
          ...(params.cursor ? { cursor: params.cursor } : {}),
        },
      },
    );
    return data;
  },
};
