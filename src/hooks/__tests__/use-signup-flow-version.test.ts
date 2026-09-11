import { createElement, type PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { signupConfigService } from '@/services/signup-config.service';
import {
  MAX_WAIT_MS,
  resolveSignupFlowVersion,
  useSignupFlowVersion,
} from '../use-signup-flow-version';
import type { SignupVersionResponse } from '@/types/signup-config.types';

// Same reason as use-app-version-gate.test.ts: the service pulls in the axios
// instance and everything behind it. Babel hoists this above the imports.
jest.mock('@/services/signup-config.service', () => ({
  signupConfigService: { getSignupVersion: jest.fn() },
}));

describe('resolveSignupFlowVersion', () => {
  it('honours an explicit v1', () => {
    expect(resolveSignupFlowVersion({ version: 'v1' })).toBe('v1');
  });

  it('honours an explicit v2', () => {
    expect(resolveSignupFlowVersion({ version: 'v2' })).toBe('v2');
  });

  it('falls back to v2 when the request failed', () => {
    expect(resolveSignupFlowVersion(undefined)).toBe('v2');
  });

  it('falls back to v2 for a version this build has no screens for', () => {
    expect(
      resolveSignupFlowVersion({ version: 'v3' } as unknown as SignupVersionResponse),
    ).toBe('v2');
  });

  it('falls back to v2 for a malformed payload', () => {
    expect(resolveSignupFlowVersion({} as SignupVersionResponse)).toBe('v2');
    expect(
      resolveSignupFlowVersion({ version: 2 } as unknown as SignupVersionResponse),
    ).toBe('v2');
  });
});

describe('useSignupFlowVersion', () => {
  const getSignupVersion = signupConfigService.getSignupVersion as jest.Mock;

  function wrapper({ children }: PropsWithChildren) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return createElement(QueryClientProvider, { client }, children);
  }

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.useRealTimers());

  it('is pending on the first render, before the request settles', async () => {
    let settle: (value: SignupVersionResponse) => void = () => {};
    getSignupVersion.mockReturnValue(
      new Promise<SignupVersionResponse>((resolve) => {
        settle = resolve;
      }),
    );

    const { result } = renderHook(() => useSignupFlowVersion(), { wrapper });

    // This is the whole fix: while in flight the caller must wait, not guess.
    expect(result.current.isPending).toBe(true);

    settle({ version: 'v2' });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.version).toBe('v2');
  });

  it('routes to v1 when the backend says so', async () => {
    getSignupVersion.mockResolvedValue({ version: 'v1' });

    const { result } = renderHook(() => useSignupFlowVersion(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.version).toBe('v1');
  });

  it('falls back to v2 and stops pending when the request fails', async () => {
    getSignupVersion.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useSignupFlowVersion(), { wrapper });

    // The hook's own retry: 1 overrides the wrapper's retry: false, so the
    // failure is only final after the second attempt (~1s retry delay).
    await waitFor(() => expect(result.current.isPending).toBe(false), {
      timeout: 4000,
    });
    expect(getSignupVersion).toHaveBeenCalledTimes(2);
    expect(result.current.version).toBe('v2');
  });

  it('stops pending at the wait cap even if the request never settles', () => {
    jest.useFakeTimers();
    getSignupVersion.mockReturnValue(new Promise<SignupVersionResponse>(() => {}));

    const { result } = renderHook(() => useSignupFlowVersion(), { wrapper });
    expect(result.current.isPending).toBe(true);

    act(() => {
      jest.advanceTimersByTime(MAX_WAIT_MS - 1);
    });
    expect(result.current.isPending).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.version).toBe('v2');
  });
});
