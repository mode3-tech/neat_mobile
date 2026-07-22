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
  /** Optional referral/redeem code — collected at signup, tracked by the backend. */
  redeemCode: string;
  phoneOtpId: string;
  emailOtpId: string;
  /** Channel that delivered the primary signup OTP. Email means the lost-BVN-phone flow. */
  primaryOtpChannel: 'sms' | 'email';
  /** verification_id from the primary signup OTP, whichever channel. */
  otpVerificationId: string;
  emailVerificationId: string;
  /** Alternate phone collected in the email-first flow — becomes the user's login number. */
  submittedPhone: string;
  submittedPhoneOtpId: string;
  submittedPhoneVerificationId: string;
  jobId: string;
  claimToken: string;
  claimExpiresAt: string;
  bvnFaceVerificationId: string;
  ninFaceVerificationId: string;

  setBvnData: (bvn: string, data: BvnData) => void;
  setNinData: (nin: string, data: NinData) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setTransactionPin: (pin: string) => void;
  setBiometrics: (enabled: boolean) => void;
  setRedeemCode: (code: string) => void;
  setPhoneOtpId: (id: string) => void;
  setEmailOtpId: (id: string) => void;
  setPrimaryOtpChannel: (channel: 'sms' | 'email') => void;
  setOtpVerificationId: (id: string) => void;
  setEmailVerificationId: (id: string) => void;
  setSubmittedPhone: (phone: string) => void;
  setSubmittedPhoneOtpId: (id: string) => void;
  setSubmittedPhoneVerificationId: (id: string) => void;
  clearSubmittedPhone: () => void;
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
  password: '',
  transactionPin: '',
  biometricsEnabled: true,
  redeemCode: '',
  phoneOtpId: '',
  emailOtpId: '',
  primaryOtpChannel: 'sms' as const,
  otpVerificationId: '',
  emailVerificationId: '',
  submittedPhone: '',
  submittedPhoneOtpId: '',
  submittedPhoneVerificationId: '',
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

  setPassword: (password) => set({ password }),

  setTransactionPin: (transactionPin) => set({ transactionPin }),

  setBiometrics: (biometricsEnabled) => set({ biometricsEnabled }),

  setRedeemCode: (redeemCode) => set({ redeemCode }),

  setPhoneOtpId: (phoneOtpId) => set({ phoneOtpId }),

  setEmailOtpId: (emailOtpId) => set({ emailOtpId }),

  setPrimaryOtpChannel: (primaryOtpChannel) => set({ primaryOtpChannel }),

  setOtpVerificationId: (otpVerificationId) => set({ otpVerificationId }),

  setEmailVerificationId: (emailVerificationId) => set({ emailVerificationId }),

  setSubmittedPhone: (submittedPhone) => set({ submittedPhone }),

  setSubmittedPhoneOtpId: (submittedPhoneOtpId) => set({ submittedPhoneOtpId }),

  setSubmittedPhoneVerificationId: (submittedPhoneVerificationId) =>
    set({ submittedPhoneVerificationId }),

  clearSubmittedPhone: () =>
    set({
      submittedPhone: '',
      submittedPhoneOtpId: '',
      submittedPhoneVerificationId: '',
    }),

  setRegistrationJob: (jobId, claimToken, claimExpiresAt) =>
    set({ jobId, claimToken, claimExpiresAt }),

  setBvnFaceVerificationId: (bvnFaceVerificationId) => set({ bvnFaceVerificationId }),

  setNinFaceVerificationId: (ninFaceVerificationId) => set({ ninFaceVerificationId }),

  reset: () => set(initialState),
}));
