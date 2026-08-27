import { create } from 'zustand';

/**
 * Accumulator for the v2 sign-up flow.
 *
 * Deliberately separate from sign-up.store.ts rather than an extension of it.
 * The two flows share no verification ids — v1's otpVerificationId, face ids
 * and submittedPhone fields have no v2 equivalent, and v2's typed identity
 * fields have no v1 equivalent. Keeping them apart stops a half-finished run
 * of one flow leaking ids into the other's register payload, and makes the
 * eventual deletion of the losing flow a clean cut.
 */
interface SignUpV2State {
  /** Typed by the user in v2, not read off the BVN record like v1. */
  phone: string;
  phoneOtpId: string;
  phoneVerificationId: string;
  /**
   * Digits already typed on the OTP screen. Kept here, not in screen state, so
   * stepping back to change the number and returning doesn't lose them — the
   * OTP screen is popped off the stack in between.
   */
  phoneOtpCode: string;
  /**
   * Date.now() at the moment the current code went out, stamped by the id
   * setter so the two can't drift apart. The OTP screens seed their resend
   * countdown from it, so re-entering the screen without sending a new code
   * shows the time actually left rather than a fresh 90s.
   */
  phoneOtpSentAt: number;

  email: string;
  emailOtpId: string;
  emailVerificationId: string;
  emailOtpCode: string;
  emailOtpSentAt: number;

  bvn: string;
  /** ISO `YYYY-MM-DD`. Sent to /validate/bvn and again on register. */
  dob: string;
  nin: string;

  /**
   * Optimus provider OTP state, only populated when /validate/bvn came back
   * with requires_otp: true. `providerReferenceId` rotates on every resend.
   */
  requiresProviderOtp: boolean;
  providerReferenceId: string;
  providerOtpSentAt: number;

  firstName: string;
  lastName: string;
  gender: string;
  maritalStatus: string;
  mothersMaidenName: string;
  address: string;
  houseNo: string;

  password: string;
  transactionPin: string;
  biometricsEnabled: boolean;
  /** Optional referral/redeem code. Sent to /validate/bvn AND register. */
  redeemCode: string;

  setPhone: (phone: string) => void;
  setPhoneOtpId: (id: string) => void;
  setPhoneVerificationId: (id: string) => void;
  setPhoneOtpCode: (code: string) => void;
  setEmail: (email: string) => void;
  setEmailOtpId: (id: string) => void;
  setEmailVerificationId: (id: string) => void;
  setEmailOtpCode: (code: string) => void;
  setBvn: (bvn: string) => void;
  setDob: (dob: string) => void;
  setNin: (nin: string) => void;
  setProviderOtp: (requiresOtp: boolean, referenceId: string) => void;
  setProviderReferenceId: (id: string) => void;
  setPersonalDetails: (details: {
    firstName: string;
    lastName: string;
    gender: string;
    maritalStatus: string;
  }) => void;
  setAddressDetails: (details: {
    mothersMaidenName: string;
    address: string;
    houseNo: string;
  }) => void;
  setPassword: (password: string) => void;
  setTransactionPin: (pin: string) => void;
  setBiometrics: (enabled: boolean) => void;
  setRedeemCode: (code: string) => void;
  reset: () => void;
}

const initialState = {
  phone: '',
  phoneOtpId: '',
  phoneVerificationId: '',
  phoneOtpCode: '',
  phoneOtpSentAt: 0,
  email: '',
  emailOtpId: '',
  emailVerificationId: '',
  emailOtpCode: '',
  emailOtpSentAt: 0,
  bvn: '',
  dob: '',
  nin: '',
  requiresProviderOtp: false,
  providerReferenceId: '',
  providerOtpSentAt: 0,
  firstName: '',
  lastName: '',
  gender: '',
  maritalStatus: '',
  mothersMaidenName: '',
  address: '',
  houseNo: '',
  password: '',
  transactionPin: '',
  biometricsEnabled: true,
  redeemCode: '',
};

export const useSignUpV2Store = create<SignUpV2State>((set) => ({
  ...initialState,

  setPhone: (phone) => set({ phone }),
  // Every id setter below stamps its own send time: an id is only ever set
  // straight off a fresh request, so the two are the same event.
  setPhoneOtpId: (phoneOtpId) => set({ phoneOtpId, phoneOtpSentAt: Date.now() }),
  setPhoneVerificationId: (phoneVerificationId) => set({ phoneVerificationId }),
  setPhoneOtpCode: (phoneOtpCode) => set({ phoneOtpCode }),

  setEmail: (email) => set({ email }),
  setEmailOtpId: (emailOtpId) => set({ emailOtpId, emailOtpSentAt: Date.now() }),
  setEmailVerificationId: (emailVerificationId) => set({ emailVerificationId }),
  setEmailOtpCode: (emailOtpCode) => set({ emailOtpCode }),

  setBvn: (bvn) => set({ bvn }),
  setDob: (dob) => set({ dob }),
  setNin: (nin) => set({ nin }),

  setProviderOtp: (requiresProviderOtp, providerReferenceId) =>
    set({ requiresProviderOtp, providerReferenceId, providerOtpSentAt: Date.now() }),

  setProviderReferenceId: (providerReferenceId) =>
    set({ providerReferenceId, providerOtpSentAt: Date.now() }),

  setPersonalDetails: ({ firstName, lastName, gender, maritalStatus }) =>
    set({ firstName, lastName, gender, maritalStatus }),

  setAddressDetails: ({ mothersMaidenName, address, houseNo }) =>
    set({ mothersMaidenName, address, houseNo }),

  setPassword: (password) => set({ password }),
  setTransactionPin: (transactionPin) => set({ transactionPin }),
  setBiometrics: (biometricsEnabled) => set({ biometricsEnabled }),
  setRedeemCode: (redeemCode) => set({ redeemCode }),

  reset: () => set(initialState),
}));
