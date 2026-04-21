import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { setAccessToken } from '@/services/api';
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
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  hydrateTokens: () => Promise<void>;
  hydrateBiometrics: () => Promise<void>;
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

  setTokens: (access, refresh) => {
    setAccessToken(access);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

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
