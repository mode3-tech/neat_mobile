import { Platform } from 'react-native';

import type { ApiEnvelope } from '@/types/api.types';
import type { AppVersionResponse } from '@/types/app-version.types';

import { api, throwApiError } from './api';

export const versionService = {
  /**
   * Public endpoint — no auth. The shared `api` instance only attaches an
   * Authorization header when a token exists, so this is safe to call before
   * sign-in and for users whose tokens have expired.
   *
   * The platform is a path segment (`/app/version/android`, `/app/version/ios`)
   * — Platform.OS is what distinguishes the two.
   *
   * The 10s timeout is deliberately tighter than the instance-wide 30s: a hung
   * request leaves the app rendering normally (the gate fails open while the
   * query is pending), so the only cost of waiting is a blocked build staying
   * usable for longer than it should.
   */
  getAppVersion: async (): Promise<AppVersionResponse> => {
    try {
      const response = await api.get<ApiEnvelope<AppVersionResponse>>(
        `/app/version/${Platform.OS}`,
        { timeout: 10_000 },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to check app version');
    }
  },
};
