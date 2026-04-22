import { create } from 'zustand';
import type { BulkRecipient } from '@/types/transfer.types';

interface BulkTransferState {
  recipients: BulkRecipient[];
  resultMessage: string;

  addRecipient: (recipient: BulkRecipient) => void;
  removeRecipient: (id: string) => void;
  setResultMessage: (message: string) => void;
  reset: () => void;
}

const initialState = {
  recipients: [] as BulkRecipient[],
  resultMessage: '',
};

export const useBulkTransferStore = create<BulkTransferState>((set) => ({
  ...initialState,

  addRecipient: (recipient) =>
    set((state) => ({ recipients: [...state.recipients, recipient] })),
  removeRecipient: (id) =>
    set((state) => ({
      recipients: state.recipients.filter((r) => r.id !== id),
    })),
  setResultMessage: (message) => set({ resultMessage: message }),
  reset: () => set(initialState),
}));
