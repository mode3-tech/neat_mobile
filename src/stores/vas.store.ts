import { create } from 'zustand';
import type { VasBiller, VasProduct } from '@/types/vas.types';

interface VasState {
  categoryId: number | null;
  categoryName: string;
  biller: VasBiller | null;
  product: VasProduct | null;
  phoneNumber: string;
  amount: string;
  /** Smartcard / IUC number — cable only. */
  smartcardNumber: string;
  /** Number of months — cable only. */
  noOfMonth: number;

  setCategory: (id: number, name: string) => void;
  setBiller: (biller: VasBiller) => void;
  setProduct: (product: VasProduct) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setAmount: (amount: string) => void;
  setSmartcardNumber: (smartcardNumber: string) => void;
  setNoOfMonth: (noOfMonth: number) => void;
  reset: () => void;
}

const initialState = {
  categoryId: null,
  categoryName: '',
  biller: null,
  product: null,
  phoneNumber: '',
  amount: '',
  smartcardNumber: '',
  noOfMonth: 1,
};

export const useVasStore = create<VasState>((set) => ({
  ...initialState,

  setCategory: (id, name) => set({ categoryId: id, categoryName: name }),

  setBiller: (biller) => set({ biller }),

  setProduct: (product) => set({ product }),

  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

  setAmount: (amount) => set({ amount }),

  setSmartcardNumber: (smartcardNumber) => set({ smartcardNumber }),

  setNoOfMonth: (noOfMonth) => set({ noOfMonth }),

  reset: () => set(initialState),
}));
