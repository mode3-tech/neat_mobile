import { create } from 'zustand';
import type { LoanSummary } from '@/types/loan.types';

interface LoanState {
  eligibleAmount: number;

  businessValue: string;
  businessAge: string;
  businessAddress: string;
  loanProduct: string;
  loanAmount: string;
  repaymentFrequency: string;

  summary: LoanSummary | null;

  setEligibleAmount: (amount: number) => void;
  setFormField: (field: keyof Pick<LoanState, 'businessValue' | 'businessAge' | 'businessAddress' | 'loanProduct' | 'loanAmount' | 'repaymentFrequency'>, value: string) => void;
  setSummary: (summary: LoanSummary) => void;
  reset: () => void;
}

const initialState = {
  eligibleAmount: 0,
  businessValue: '',
  businessAge: '',
  businessAddress: '',
  loanProduct: '',
  loanAmount: '',
  repaymentFrequency: '',
  summary: null,
};

export const useLoanStore = create<LoanState>((set) => ({
  ...initialState,

  setEligibleAmount: (amount) => set({ eligibleAmount: amount }),

  setFormField: (field, value) => set({ [field]: value }),

  setSummary: (summary) => set({ summary }),

  reset: () => set(initialState),
}));
