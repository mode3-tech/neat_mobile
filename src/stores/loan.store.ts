import { create } from 'zustand';
import type { LoanApplySummary } from '@/types/loan.types';

interface LoanState {
  eligibleAmount: number;

  businessValue: string;
  businessAge: string;
  businessAddress: string;
  loanProduct: string;
  loanProductCode: string;
  loanAmount: string;
  repaymentFrequency: string;
  interestRateBps: number;
  loanTermValue: number;

  summary: LoanApplySummary | null;
  applicationRef: string | null;

  setEligibleAmount: (amount: number) => void;
  setFormField: (field: keyof Pick<LoanState, 'businessValue' | 'businessAge' | 'businessAddress' | 'loanProduct' | 'loanProductCode' | 'loanAmount' | 'repaymentFrequency'>, value: string) => void;
  setProductDetails: (details: { interestRateBps: number; loanTermValue: number }) => void;
  setSummary: (summary: LoanApplySummary) => void;
  setApplicationRef: (ref: string) => void;
  reset: () => void;
}

const initialState = {
  eligibleAmount: 0,
  businessValue: '',
  businessAge: '',
  businessAddress: '',
  loanProduct: '',
  loanProductCode: '',
  loanAmount: '',
  repaymentFrequency: '',
  interestRateBps: 0,
  loanTermValue: 0,
  summary: null,
  applicationRef: null,
};

export const useLoanStore = create<LoanState>((set) => ({
  ...initialState,

  setEligibleAmount: (amount) => set({ eligibleAmount: amount }),

  setFormField: (field, value) => set({ [field]: value }),

  setProductDetails: (details) => set(details),

  setSummary: (summary) => set({ summary }),

  setApplicationRef: (ref) => set({ applicationRef: ref }),

  reset: () => set(initialState),
}));
