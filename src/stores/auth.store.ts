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
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  biometricsEnabled: false,

  setTokens: (access, refresh) => {
    setAccessToken(access);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  setBiometricsEnabled: (enabled) => {
    SecureStore.setItemAsync('biometrics_enabled', JSON.stringify(enabled)).catch(() => {});
    set({ biometricsEnabled: enabled });
  },

  clearAuth: () => {
    setAccessToken(null);
    SecureStore.deleteItemAsync('access_token').catch(() => {});
    SecureStore.deleteItemAsync('refresh_token').catch(() => {});
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
