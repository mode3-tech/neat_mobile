import { create } from 'zustand';

import type { BvnData, NinData } from '@/types/sign-up.types';

interface SignUpState {
  bvn: string;
  bvnData: BvnData | null;
  nin: string;
  ninData: NinData | null;
  phone: string;
  email: string;
  password: string;
  transactionPin: string;
  biometricsEnabled: boolean;
  phoneVerificationId: string;
  emailVerificationId: string;

  setBvnData: (bvn: string, data: BvnData) => void;
  setNinData: (nin: string, data: NinData) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setTransactionPin: (pin: string) => void;
  setBiometrics: (enabled: boolean) => void;
  setPhoneVerificationId: (id: string) => void;
  setEmailVerificationId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  bvn: '',
  bvnData: null,
  nin: '',
  ninData: null,
  phone: '',
  email: '',
  password: '',
  transactionPin: '',
  biometricsEnabled: false,
  phoneVerificationId: '',
  emailVerificationId: '',
};

export const useSignUpStore = create<SignUpState>((set) => ({
  ...initialState,

  setBvnData: (bvn, data) =>
    set({ bvn, bvnData: data, phone: data.phone_number }),

  setNinData: (nin, data) => set({ nin, ninData: data }),

  setEmail: (email) => set({ email }),

  setPassword: (password) => set({ password }),

  setTransactionPin: (transactionPin) => set({ transactionPin }),

  setBiometrics: (biometricsEnabled) => set({ biometricsEnabled }),

  setPhoneVerificationId: (phoneVerificationId) => set({ phoneVerificationId }),

  setEmailVerificationId: (emailVerificationId) => set({ emailVerificationId }),

  reset: () => set(initialState),
}));
