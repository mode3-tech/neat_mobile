import { create } from 'zustand';

interface PinChangeDraft {
  verificationId: string;
}

interface PasswordChangeDraft {
  verificationId: string;
}

interface SecurityChangeState {
  pinChange: PinChangeDraft | null;
  passwordChange: PasswordChangeDraft | null;
  setPinChange: (draft: PinChangeDraft) => void;
  setPasswordChange: (draft: PasswordChangeDraft) => void;
  clearPinChange: () => void;
  clearPasswordChange: () => void;
}

export const useSecurityChangeStore = create<SecurityChangeState>((set) => ({
  pinChange: null,
  passwordChange: null,

  setPinChange: (pinChange) => set({ pinChange }),
  setPasswordChange: (passwordChange) => set({ passwordChange }),
  clearPinChange: () => set({ pinChange: null }),
  clearPasswordChange: () => set({ passwordChange: null }),
}));
