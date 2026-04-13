import type {
  SavingsDepositPayload,
  SavingsDepositResponse,
} from '@/types/savings.types';
import { api } from './api';

export const savingsService = {
  deposit: async (payload: SavingsDepositPayload): Promise<SavingsDepositResponse> => {
    const { data } = await api.post<SavingsDepositResponse>(
      '/wallet/savings/deposit',
      payload,
    );
    return data;
  },
};
