import { create } from 'zustand';
import type { VasBiller, VasProduct } from '@/types/vas.types';

interface VasState {
  categoryId: number | null;
  categoryName: string;
  biller: VasBiller | null;
  product: VasProduct | null;
  phoneNumber: string;
  amount: string;

  setCategory: (id: number, name: string) => void;
  setBiller: (biller: VasBiller) => void;
  setProduct: (product: VasProduct) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setAmount: (amount: string) => void;
  reset: () => void;
}

const initialState = {
  categoryId: null,
  categoryName: '',
  biller: null,
  product: null,
  phoneNumber: '',
  amount: '',
};

export const useVasStore = create<VasState>((set) => ({
  ...initialState,

  setCategory: (id, name) => set({ categoryId: id, categoryName: name }),

  setBiller: (biller) => set({ biller }),

  setProduct: (product) => set({ product }),

  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

  setAmount: (amount) => set({ amount }),

  reset: () => set(initialState),
}));
