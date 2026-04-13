import { create } from 'zustand';

interface SavingsState {
  amount: string;

  setAmount: (amount: string) => void;
  reset: () => void;
}

const initialState = {
  amount: '',
};

export const useSavingsStore = create<SavingsState>((set) => ({
  ...initialState,

  setAmount: (amount) => set({ amount }),
  reset: () => set(initialState),
}));
