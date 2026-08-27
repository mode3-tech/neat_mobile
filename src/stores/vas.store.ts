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
  /** Meter number — electricity only. */
  meterNumber: string;
  /** Meter type ("prepaid"/"postpaid") — electricity only. */
  accountType: string;
  /** Spend the cashback balance on this purchase — airtime only for now. */
  useCashback: boolean;

  setCategory: (id: number, name: string) => void;
  setBiller: (biller: VasBiller) => void;
  setProduct: (product: VasProduct) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setAmount: (amount: string) => void;
  setSmartcardNumber: (smartcardNumber: string) => void;
  setNoOfMonth: (noOfMonth: number) => void;
  setMeterNumber: (meterNumber: string) => void;
  setAccountType: (accountType: string) => void;
  setUseCashback: (useCashback: boolean) => void;
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
  meterNumber: '',
  accountType: '',
  useCashback: false,
};

export const useVasStore = create<VasState>((set) => ({
  ...initialState,

  // Entering any VAS flow clears the cashback choice. `reset()` only runs when
  // the user taps "Back to Dashboard" on the result screen, so without this a
  // `true` left over from an airtime purchase could leak into the next flow.
  setCategory: (id, name) =>
    set({ categoryId: id, categoryName: name, useCashback: false }),

  setBiller: (biller) => set({ biller }),

  setProduct: (product) => set({ product }),

  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

  setAmount: (amount) => set({ amount }),

  setSmartcardNumber: (smartcardNumber) => set({ smartcardNumber }),

  setNoOfMonth: (noOfMonth) => set({ noOfMonth }),

  setMeterNumber: (meterNumber) => set({ meterNumber }),

  setAccountType: (accountType) => set({ accountType }),

  setUseCashback: (useCashback) => set({ useCashback }),

  reset: () => set(initialState),
}));
