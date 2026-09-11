import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { setAccessToken } from '@/services/api';
import {
  forgetRememberedAccount,
  getRememberedAccount,
  isSamePhone,
  persistRememberedAccount,
  type RememberedAccount,
} from '@/services/remembered-account';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  biometricsEnabled: boolean;
  biometricsHydrated: boolean;
  tokensHydrated: boolean;
  hasStoredTokens: boolean;
  // The last account to sign in successfully on this device. Survives logout so
  // the next launch only has to ask for a password. Cleared by switchAccount().
  rememberedAccount: RememberedAccount | null;
  // One-shot: when true, the next isAuthenticated true→false transition does NOT
  // redirect to sign-in (the screen that cleared auth handles navigation itself,
  // e.g. account-closure routes to /welcome). Consumed (reset) by the subscriber.
  skipLogoutRedirect: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  rememberAccount: (account: Partial<RememberedAccount>) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setSkipLogoutRedirect: (skip: boolean) => void;
  hydrateTokens: () => Promise<void>;
  hydrateBiometrics: () => Promise<void>;
  hydrateRememberedAccount: () => Promise<void>;
  switchAccount: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  biometricsEnabled: false,
  biometricsHydrated: false,
  tokensHydrated: false,
  hasStoredTokens: false,
  rememberedAccount: null,
  skipLogoutRedirect: false,

  setTokens: (access, refresh) => {
    setAccessToken(access);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
    if (user.phone) {
      useAuthStore.getState().rememberAccount({ phone: user.phone, firstName: user.firstName });
    }
  },

  // Merges over what's already remembered. The phone typed at sign-in is what
  // /auth/login accepted, so when the backend later echoes the same number in
  // a different format (user.phone, /account/summary) the typed one is kept.
  // A different number starts a fresh record so the previous user's name
  // doesn't carry over.
  rememberAccount: (account) => {
    const current = useAuthStore.getState().rememberedAccount;
    const incoming = account.phone || current?.phone;
    if (!incoming) return;
    const sameAccount = !!current && isSamePhone(current.phone, incoming);
    const merged: RememberedAccount = {
      phone: sameAccount ? current.phone : incoming,
      firstName: account.firstName || (sameAccount ? current.firstName : ''),
    };
    persistRememberedAccount(merged).catch(() => {});
    set({ rememberedAccount: merged });
  },

  setSkipLogoutRedirect: (skip) => set({ skipLogoutRedirect: skip }),

  setBiometricsEnabled: (enabled) => {
    SecureStore.setItemAsync('biometrics_enabled', JSON.stringify(enabled)).catch(() => {});
    if (!enabled) {
      import('@/services/biometric.service')
        .then(({ clearStoredTransactionPin }) => {
          clearStoredTransactionPin();
        })
        .catch(() => {});
    }
    set({ biometricsEnabled: enabled });
  },

  hydrateTokens: async () => {
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync('access_token'),
        SecureStore.getItemAsync('refresh_token'),
      ]);
      set({ tokensHydrated: true, hasStoredTokens: !!(access && refresh) });
    } catch {
      set({ tokensHydrated: true, hasStoredTokens: false });
    }
  },

  hydrateBiometrics: async () => {
    try {
      const stored = await SecureStore.getItemAsync('biometrics_enabled');
      if (stored !== null) {
        set({ biometricsEnabled: JSON.parse(stored), biometricsHydrated: true });
      } else {
        set({ biometricsHydrated: true });
      }
    } catch {
      set({ biometricsHydrated: true });
    }
  },

  hydrateRememberedAccount: async () => {
    set({ rememberedAccount: await getRememberedAccount() });
  },

  // "Not you?" — forget the account entirely and fall back to the full
  // phone + password form. The tokens have to go too, otherwise hasStoredTokens
  // keeps the device looking like it belongs to the previous user.
  switchAccount: async () => {
    await Promise.all([
      forgetRememberedAccount(),
      SecureStore.deleteItemAsync('access_token').catch(() => {}),
      SecureStore.deleteItemAsync('refresh_token').catch(() => {}),
    ]);
    setAccessToken(null);
    set({ rememberedAccount: null, hasStoredTokens: false });
  },

  clearAuth: () => {
    // Remove push token from backend (fire-and-forget — must not block logout).
    // Note: the token may already be cleared by the time the request fires,
    // causing a 401. This is acceptable — the backend cleans up stale tokens
    // via its receipt-checking cron job.
    import('@/services/notification.service')
      .then(({ removeTokenFromBackend }) => removeTokenFromBackend())
      .catch(() => {});

    // Clear cached transaction PIN (security-sensitive).
    import('@/services/biometric.service')
      .then(({ clearStoredTransactionPin }) => {
        clearStoredTransactionPin();
      })
      .catch(() => {});

    // Drop the locally cached profile photo so the next user on this device
    // doesn't inherit the previous account's avatar.
    import('@/stores/profile.store')
      .then(({ useProfileStore }) => {
        useProfileStore.getState().clearPhoto();
      })
      .catch(() => {});

    setAccessToken(null);
    // Tokens are kept in SecureStore so hasStoredTokens remains true on next
    // app open (sign-in page, not welcome). They are overwritten on next login.
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
