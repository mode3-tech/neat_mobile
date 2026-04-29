import type {
  ActiveLoan,
  LoanApplyPayload,
  LoanApplyResponse,
  LoanDetails,
  LoanDetailsResponse,
  LoanEligibility,
  LoanHistoryItem,
  LoanHistoryResponse,
  LoanProduct,
  LoanRepayment,
  LoanRepaymentResponse,
  LoanStatusItem,
  LoanStatusResponse,
  ManualRepaymentRequest,
  ManualRepaymentResponse,
} from '@/types/loan.types';
import axios from 'axios';
import { api } from './api';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractErrorMessage(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);
  }
  throw new Error(fallback);
}

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
    const { data } = await api.get<LoanRepaymentResponse>('/loan/repayment-schedule', {
      params: { loan_id: loanId },
    });
    return data.repayment;
  },

  submitApplication: async (payload: LoanApplyPayload): Promise<LoanApplyResponse> => {
    const { data } = await api.post<LoanApplyResponse>('/loan/apply', payload);
    return data;
  },

  getLoanHistory: async (): Promise<LoanHistoryItem[]> => {
    const { data } = await api.get<LoanHistoryResponse>('/loan/history');
    return data.history;
  },

  getLoanDetails: async (loanId: string): Promise<LoanDetails> => {
    const { data } = await api.get<LoanDetailsResponse>(
      `/loan/loans/${encodeURIComponent(loanId)}`,
    );
    return data.details;
  },

  getLoanHistoryById: async (loanId: string): Promise<LoanHistoryItem[]> => {
    const { data } = await api.get<LoanHistoryResponse>(
      `/loan/history/${encodeURIComponent(loanId)}`,
    );
    return data.history;
  },

  submitRepayment: async (
    payload: ManualRepaymentRequest,
  ): Promise<ManualRepaymentResponse> => {
    try {
      const { data } = await api.post<ManualRepaymentResponse>(
        '/loan/repayment/manual',
        payload,
      );
      return data;
    } catch (error) {
      extractErrorMessage(error, 'Repayment failed. Please try again.');
    }
  },
};
