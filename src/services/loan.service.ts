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
  ManualRepaymentRequest,
} from '@/types/loan.types';
import type { ApiEnvelope } from '@/types/api.types';
import { api, throwApiError } from './api';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const loanService = {
  getEligibility: async (): Promise<LoanEligibility> => {
    await delay(800);
    return { eligible_amount: 500000 };
  },

  getLoanProducts: async (): Promise<LoanProduct[]> => {
    try {
      const response = await api.get<ApiEnvelope<LoanProduct[]>>('/loan');
      return response.data.data ?? [];
    } catch (error) {
      throwApiError(error, 'Failed to load loan products');
    }
  },

  getActiveLoans: async (): Promise<ActiveLoan[]> => {
    try {
      const response = await api.get<ApiEnvelope<{ loans: ActiveLoan[] }>>(
        '/loan/loans/active',
      );
      return response.data.data?.loans ?? [];
    } catch (error) {
      throwApiError(error, 'Failed to load active loans');
    }
  },

  getAllLoans: async (): Promise<LoanStatusItem[]> => {
    try {
      const response = await api.get<ApiEnvelope<LoanStatusItem[]>>('/loan/loans');
      return response.data.data ?? [];
    } catch (error) {
      throwApiError(error, 'Failed to load loans');
    }
  },

  getRepaymentSchedule: async (loanId: string): Promise<LoanRepayment> => {
    try {
      const response = await api.get<ApiEnvelope<LoanRepaymentResponse>>(
        '/loan/repayment-schedule',
        { params: { loan_id: loanId } },
      );
      return response.data.data.repayment;
    } catch (error) {
      throwApiError(error, 'Failed to load repayment schedule');
    }
  },

  submitApplication: async (payload: LoanApplyPayload): Promise<LoanApplyResponse> => {
    try {
      const response = await api.post<ApiEnvelope<LoanApplyResponse>>(
        '/loan/apply',
        payload,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Loan application failed. Please try again.');
    }
  },

  getLoanHistory: async (): Promise<LoanHistoryItem[]> => {
    try {
      const response = await api.get<ApiEnvelope<LoanHistoryResponse>>('/loan/history');
      return response.data.data?.history ?? [];
    } catch (error) {
      throwApiError(error, 'Failed to load loan history');
    }
  },

  getLoanDetails: async (loanId: string): Promise<LoanDetails> => {
    try {
      const response = await api.get<ApiEnvelope<LoanDetailsResponse>>(
        `/loan/loans/${encodeURIComponent(loanId)}`,
      );
      return response.data.data.details;
    } catch (error) {
      throwApiError(error, 'Failed to load loan details');
    }
  },

  getLoanHistoryById: async (loanId: string): Promise<LoanHistoryItem[]> => {
    try {
      const response = await api.get<ApiEnvelope<LoanHistoryResponse>>(
        `/loan/history/${encodeURIComponent(loanId)}`,
      );
      return response.data.data?.history ?? [];
    } catch (error) {
      throwApiError(error, 'Failed to load loan history');
    }
  },

  submitRepayment: async (payload: ManualRepaymentRequest): Promise<void> => {
    try {
      await api.post<ApiEnvelope>('/loan/repayment/manual', payload);
    } catch (error) {
      throwApiError(error, 'Repayment failed. Please try again.');
    }
  },
};
