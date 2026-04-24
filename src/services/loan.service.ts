import type {
  ActiveLoan,
  LoanApplyPayload,
  LoanApplyResponse,
  LoanEligibility,
  LoanProduct,
  LoanRepayment,
  LoanRepaymentResponse,
  LoanStatusItem,
  LoanStatusResponse,
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

  getActiveLoans: async (): Promise<ActiveLoan[]> => {
    const { data } = await api.get<{ status: string; message: string; loans: ActiveLoan[] }>(
      '/loan/loans/active',
    );
    return data.loans;
  },

  getAllLoans: async (): Promise<LoanStatusItem[]> => {
    const { data } = await api.get<LoanStatusResponse>('/loan/loans');
    return data.loans;
  },

  getRepaymentSchedule: async (loanId: string): Promise<LoanRepayment> => {
    const { data } = await api.get<LoanRepaymentResponse>(
      `/loan/repayment-schedule/${encodeURIComponent(loanId)}`,
    );
    return data.repayment;
  },

  submitApplication: async (payload: LoanApplyPayload): Promise<LoanApplyResponse> => {
    const { data } = await api.post<LoanApplyResponse>('/loan/apply', payload);
    return data;
  },
};
