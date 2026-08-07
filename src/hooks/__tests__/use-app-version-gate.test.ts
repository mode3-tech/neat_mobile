import { createElement, type PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { versionService } from '@/services/version.service';
import {
  resolveVersionState,
  useAppVersionGate,
} from '../use-app-version-gate';
import type { AppVersionResponse } from '@/types/app-version.types';

// The module under test pulls in version.service, which pulls in the axios
// instance (and with it secure-store, device binding, …). The pure comparison
// needs none of it, and the hook tests below drive the service directly.
// Babel hoists this above the imports above.
jest.mock('@/services/version.service', () => ({
  versionService: { getAppVersion: jest.fn() },
}));
jest.mock('expo-application', () => ({ nativeBuildVersion: '7' }));

// The endpoint is per-platform (/app/version/android), so the policy arrives
// flat. Production today: min_build 1, latest_build 7; this feature ships in 8.
const policy = (min: number, latest: number): AppVersionResponse => ({
  min_build: min,
  latest_build: latest,
  store_url:
    'https://play.google.com/store/apps/details?id=com.mode3.neatmobile',
});

// The older wrapped shape, still parsed as a fallback.
const wrapped = (min: number, latest: number): AppVersionResponse => ({
  android: { min_build: min, latest_build: latest },
});

describe('resolveVersionState', () => {
  describe('the three states', () => {
    it('is ok when the installed build is the latest', () => {
      expect(resolveVersionState(policy(1, 7), '7', 'android')).toBe('ok');
    });

    it('is ok when the installed build is ahead of latest', () => {
      expect(resolveVersionState(policy(1, 7), '8', 'android')).toBe('ok');
    });

    it('is soft when the build is supported but behind latest', () => {
      expect(resolveVersionState(policy(1, 8), '7', 'android')).toBe('soft');
    });

    it('is hard when the build is below the minimum', () => {
      expect(resolveVersionState(policy(8, 8), '7', 'android')).toBe('hard');
    });

    it('is ok exactly at the minimum', () => {
      expect(resolveVersionState(policy(7, 7), '7', 'android')).toBe('ok');
    });

    it('prefers hard over soft when the build is below both', () => {
      expect(resolveVersionState(policy(5, 9), '3', 'android')).toBe('hard');
    });

    it('compares numerically, not lexicographically', () => {
      // '10' < '9' as strings — a string compare would wrongly block here.
      expect(resolveVersionState(policy(9, 9), '10', 'android')).toBe('ok');
    });

    it('applies a flat payload to whichever platform asked for it', () => {
      // /app/version/<platform> already scoped the answer, so a flat policy is
      // this platform's policy.
      expect(resolveVersionState(policy(9, 9), '7', 'ios')).toBe('hard');
      expect(resolveVersionState(policy(9, 9), '7', 'android')).toBe('hard');
    });

    it('still reads the older wrapped shape', () => {
      expect(resolveVersionState(wrapped(9, 9), '7', 'android')).toBe('hard');
      expect(resolveVersionState(wrapped(1, 9), '7', 'android')).toBe('soft');
      expect(resolveVersionState(wrapped(1, 1), '7', 'android')).toBe('ok');
    });
  });

  describe('fails open', () => {
    it('when there is no data (pending, network error, or 5xx)', () => {
      expect(resolveVersionState(undefined, '1', 'android')).toBe('ok');
    });

    it('when the payload has no platform keys at all', () => {
      expect(resolveVersionState({}, '1', 'android')).toBe('ok');
    });

    it('when a wrapped payload has no key for this platform', () => {
      const iosOnly = { ios: { min_build: 99, latest_build: 99 } };
      expect(resolveVersionState(iosOnly, '1', 'android')).toBe('ok');
      expect(resolveVersionState(wrapped(99, 99), '1', 'ios')).toBe('ok');
    });

    it('when nativeBuildVersion is null', () => {
      expect(resolveVersionState(policy(99, 99), null, 'android')).toBe('ok');
    });

    it('when nativeBuildVersion is an empty string', () => {
      // Guarded explicitly: Number('') is 0, which would read as an ancient
      // build and hard-block every user.
      expect(resolveVersionState(policy(99, 99), '', 'android')).toBe('ok');
      expect(resolveVersionState(policy(99, 99), '   ', 'android')).toBe('ok');
    });

    it('when nativeBuildVersion is not a number', () => {
      expect(resolveVersionState(policy(99, 99), 'abc', 'android')).toBe('ok');
      expect(resolveVersionState(policy(99, 99), '1.0.0', 'android')).toBe(
        'ok',
      );
    });

    it('when min_build and latest_build are missing', () => {
      const empty = { android: {} } as unknown as AppVersionResponse;
      expect(resolveVersionState(empty, '7', 'android')).toBe('ok');
    });

    it('when min_build and latest_build are not numbers', () => {
      const junk = {
        android: { min_build: 'nine', latest_build: null },
      } as unknown as AppVersionResponse;
      expect(resolveVersionState(junk, '7', 'android')).toBe('ok');
    });

    it('when min_build is junk but latest_build is valid (soft still works)', () => {
      const partial = {
        android: { min_build: 'nine', latest_build: 9 },
      } as unknown as AppVersionResponse;
      expect(resolveVersionState(partial, '7', 'android')).toBe('soft');
    });

    it('when store_url is absent', () => {
      const noUrl = { android: { min_build: 1, latest_build: 9 } };
      expect(resolveVersionState(noUrl, '7', 'android')).toBe('soft');
    });
  });
});

describe('useAppVersionGate', () => {
  const getAppVersion = versionService.getAppVersion as jest.Mock;

  // Both platform keys, same numbers, so these tests do not depend on which
  // platform jest-expo defaults to.
  const bothPlatforms = (min: number, latest: number, storeUrl?: string) => ({
    android: { min_build: min, latest_build: latest, store_url: storeUrl },
    ios: { min_build: min, latest_build: latest, store_url: storeUrl },
  });

  function wrapper({ children }: PropsWithChildren) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return createElement(QueryClientProvider, { client }, children);
  }

  beforeEach(() => jest.clearAllMocks());

  it('is ok on the very first render, before the request settles', async () => {
    let settle: (value: AppVersionResponse) => void = () => {};
    getAppVersion.mockReturnValue(
      new Promise<AppVersionResponse>((resolve) => {
        settle = resolve;
      }),
    );

    const { result } = renderHook(() => useAppVersionGate(), { wrapper });

    // Synchronously ok while in flight — this is what keeps first paint
    // unblocked no matter how slow the backend is.
    expect(result.current.state).toBe('ok');

    // Let the request finish so jest has no dangling promise to wait on.
    settle({});
    await waitFor(() => expect(getAppVersion).toHaveBeenCalled());
  });

  it('stays ok when the request fails (offline, 5xx, 404)', async () => {
    getAppVersion.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAppVersionGate(), { wrapper });

    await waitFor(() => expect(getAppVersion).toHaveBeenCalled());
    expect(result.current.state).toBe('ok');
    expect(result.current.storeUrl).toBeUndefined();
  });

  it('does not retry a failed check', async () => {
    getAppVersion.mockRejectedValue(new Error('Network Error'));

    renderHook(() => useAppVersionGate(), { wrapper });

    await waitFor(() => expect(getAppVersion).toHaveBeenCalled());
    // Give any retry a chance to fire before asserting there wasn't one.
    await new Promise((r) => setTimeout(r, 50));
    expect(getAppVersion).toHaveBeenCalledTimes(1);
  });

  it('blocks and surfaces store_url once the backend says the build is dead', async () => {
    // Installed build is 7 (mocked above); minimum is 9.
    getAppVersion.mockResolvedValue(bothPlatforms(9, 9, 'https://play/x'));

    const { result } = renderHook(() => useAppVersionGate(), { wrapper });

    await waitFor(() => expect(result.current.state).toBe('hard'));
    expect(result.current.storeUrl).toBe('https://play/x');
  });

  it('prompts softly when a newer build exists', async () => {
    getAppVersion.mockResolvedValue(bothPlatforms(1, 9));

    const { result } = renderHook(() => useAppVersionGate(), { wrapper });

    await waitFor(() => expect(result.current.state).toBe('soft'));
  });
});
