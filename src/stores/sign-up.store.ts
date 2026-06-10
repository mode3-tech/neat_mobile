import { create } from 'zustand';

import type { BvnData, NinData } from '@/types/sign-up.types';

interface SignUpState {
  bvn: string;
  bvnData: BvnData | null;
  nin: string;
  ninData: NinData | null;
  phone: string;
  email: string;
  mothersMaidenName: string;
  password: string;
  transactionPin: string;
  biometricsEnabled: boolean;
  phoneVerificationId: string;
  emailVerificationId: string;
  jobId: string;
  claimToken: string;
  claimExpiresAt: string;
  bvnFaceVerificationId: string;
  ninFaceVerificationId: string;

  setBvnData: (bvn: string, data: BvnData) => void;
  setNinData: (nin: string, data: NinData) => void;
  setEmail: (email: string) => void;
  setMothersMaidenName: (name: string) => void;
  setPassword: (password: string) => void;
  setTransactionPin: (pin: string) => void;
  setBiometrics: (enabled: boolean) => void;
  setPhoneVerificationId: (id: string) => void;
  setEmailVerificationId: (id: string) => void;
  setRegistrationJob: (
    jobId: string,
    claimToken: string,
    claimExpiresAt: string,
  ) => void;
  setBvnFaceVerificationId: (id: string) => void;
  setNinFaceVerificationId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  bvn: '',
  bvnData: null,
  nin: '',
  ninData: null,
  phone: '',
  email: '',
  mothersMaidenName: '',
  password: '',
  transactionPin: '',
  biometricsEnabled: true,
  phoneVerificationId: '',
  emailVerificationId: '',
  jobId: '',
  claimToken: '',
  claimExpiresAt: '',
  bvnFaceVerificationId: '',
  ninFaceVerificationId: '',
};

export const useSignUpStore = create<SignUpState>((set) => ({
  ...initialState,

  setBvnData: (bvn, data) =>
    set({ bvn, bvnData: data, phone: data.phone_number }),

  setNinData: (nin, data) => set({ nin, ninData: data }),

  setEmail: (email) => set({ email }),

  setMothersMaidenName: (mothersMaidenName) => set({ mothersMaidenName }),

  setPassword: (password) => set({ password }),

  setTransactionPin: (transactionPin) => set({ transactionPin }),

  setBiometrics: (biometricsEnabled) => set({ biometricsEnabled }),

  setPhoneVerificationId: (phoneVerificationId) => set({ phoneVerificationId }),

  setEmailVerificationId: (emailVerificationId) => set({ emailVerificationId }),

  setRegistrationJob: (jobId, claimToken, claimExpiresAt) =>
    set({ jobId, claimToken, claimExpiresAt }),

  setBvnFaceVerificationId: (bvnFaceVerificationId) => set({ bvnFaceVerificationId }),

  setNinFaceVerificationId: (ninFaceVerificationId) => set({ ninFaceVerificationId }),

  reset: () => set(initialState),
}));
