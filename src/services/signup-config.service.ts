import type { ApiEnvelope } from '@/types/api.types';
import type { SignupVersionResponse } from '@/types/signup-config.types';

import { api, throwApiError } from './api';

// /register-version sits at the server ROOT, not under /api/v1 like most
// routes — the shared `api` instance's baseURL would 404 here. Same situation
// as /app/version/<platform> in version.service.ts, and the same fix: derive
// the origin from the env var rather than hardcoding a host that has changed
// before. Trailing slash and a missing /api/v1 suffix both tolerated.
const API_ROOT = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(
  /\/api\/v1\/?$/,
  '',
);

export const signupConfigService = {
  /**
   * Which sign-up flow the backend wants this app to run.
   *
   * Public endpoint — no auth. The shared `api` instance only attaches an
   * Authorization header when a token exists, so this is safe to call from the
   * welcome screen before anyone has signed in.
   *
   * The 8s timeout is deliberately tighter than the instance-wide 30s. The
   * caller falls back to v1 while this is pending, so a hung request costs
   * nothing but a slower switch to v2 — and must never make "Create account"
   * feel unresponsive.
   */
  getSignupVersion: async (): Promise<SignupVersionResponse> => {
    try {
      const response = await api.get<ApiEnvelope<SignupVersionResponse>>(
        `${API_ROOT}/register-version`,
        { timeout: 8_000 },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to check sign-up version');
    }
  },
};
