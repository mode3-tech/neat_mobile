import type {
  Transaction,
  RecentTransactionsResponse,
} from '@/types/transaction.types';
import { api } from './api';

export const transactionService = {
  getRecent: async (): Promise<Transaction[]> => {
    const { data } = await api.get<RecentTransactionsResponse>(
      '/transaction/recent',
    );
    return data.transactions;
  },
};
