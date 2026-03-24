import type {
  LoanApplyPayload,
  LoanApplyResponse,
  LoanEligibility,
  LoanProduct,
} from '@/types/loan.types';
import { api } from './api';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const loanService = {
  getEligibility: async (): Promise<LoanEligibility> => {
    await delay(800);
    return { eligible_amount: 500000 };
  },

  getLoanProducts: async (): Promise<LoanProduct[]> => {
    const { data } = await api.get<{ message: string; products: LoanProduct[] }>('/loan');
    return data.products;
  },

  submitApplication: async (payload: LoanApplyPayload): Promise<LoanApplyResponse> => {
    const { data } = await api.post<LoanApplyResponse>('/loan/apply', payload);
    return data;
  },
};
