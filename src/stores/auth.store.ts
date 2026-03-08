import { create } from 'zustand';

import { setAccessToken } from '@/services/api';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setTokens: (access, refresh) => {
    setAccessToken(access);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
