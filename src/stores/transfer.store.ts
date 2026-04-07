import { create } from 'zustand';
import type { TransferResult, TransferType } from '@/types/transfer.types';

interface TransferState {
  transferType: TransferType;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: string;
  narration: string;
  senderPhone: string;
  senderName: string;
  transferResult: TransferResult | null;

  setTransferType: (type: TransferType) => void;
  setBank: (code: string, name: string) => void;
  setAccountDetails: (accountNumber: string, accountName: string) => void;
  setAmount: (amount: string) => void;
  setNarration: (narration: string) => void;
  setSenderPhone: (phone: string) => void;
  setSenderName: (name: string) => void;
  setTransferResult: (result: TransferResult) => void;
  reset: () => void;
}

const initialState = {
  transferType: 'neatpay' as TransferType,
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  amount: '',
  narration: '',
  senderPhone: '',
  senderName: '',
  transferResult: null,
};

export const useTransferStore = create<TransferState>((set) => ({
  ...initialState,

  setTransferType: (type) => set({ transferType: type }),
  setBank: (code, name) => set({ bankCode: code, bankName: name }),
  setAccountDetails: (accountNumber, accountName) =>
    set({ accountNumber, accountName }),
  setAmount: (amount) => set({ amount }),
  setNarration: (narration) => set({ narration }),
  setSenderPhone: (phone) => set({ senderPhone: phone }),
  setSenderName: (name) => set({ senderName: name }),
  setTransferResult: (result) => set({ transferResult: result }),
  reset: () => set(initialState),
}));
