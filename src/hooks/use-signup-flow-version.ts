import { useQuery } from '@tanstack/react-query';

import { signupConfigService } from '@/services/signup-config.service';
import { QUERY_KEYS } from '@/constants';
import {
  DEFAULT_SIGNUP_FLOW_VERSION,
  type SignupFlowVersion,
} from '@/constants/signup-version';
import type { SignupVersionResponse } from '@/types/signup-config.types';

// Long enough that a user who starts sign-up under one version isn't switched
// mid-flow, short enough that a backend flip reaches live apps without waiting
// for a restart.
const STALE_TIME_MS = 1000 * 60 * 10; // 10 minutes

/**
 * Narrow the backend's answer to a version we actually have screens for.
 *
 * Pure and exported so the fallback contract can be unit-tested without a
 * device — see __tests__/use-signup-flow-version.test.ts.
 *
 * EVERY uncertain path returns the default. Undefined covers the pending first
 * render, a network failure, a 404 and a 5xx; an unrecognized string covers a
 * future 'v3' that this build has no screens for. Routing someone into a route
 * group that does not exist would dead-end them at a blank screen, so the only
 * thing that moves us off v1 is an exact, known version string.
 */
export function resolveSignupFlowVersion(
  data: SignupVersionResponse | undefined,
): SignupFlowVersion {
  if (!data) return DEFAULT_SIGNUP_FLOW_VERSION;
  if (data.version === 'v1' || data.version === 'v2') return data.version;
  return DEFAULT_SIGNUP_FLOW_VERSION;
}

/**
 * Which sign-up flow to enter. Safe to call before sign-in.
 *
 * Note this decides the flow at the moment "Create account" is tapped. Someone
 * already partway through v1 stays in v1 even if the flag flips behind them —
 * their half-filled store and verification ids belong to that flow.
 */
export function useSignupFlowVersion(): SignupFlowVersion {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.SIGNUP_FLOW_VERSION],
    queryFn: signupConfigService.getSignupVersion,
    staleTime: STALE_TIME_MS,
    // The root QueryClient defaults to retry: 2. Falling back to v1 quickly is
    // better than making someone wait through retries to find out.
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ← local testing: force a flow without touching the backend. Set back to
  //   null (or leave commented) before pushing.
  //   The `as` widens the literal — without it TS narrows the const and flags
  //   the other branch as unreachable.
  // const FORCE_VERSION = 'v2' as SignupFlowVersion | null; // 'v1' | 'v2' | null
  // return FORCE_VERSION ?? resolveSignupFlowVersion(data);

  return resolveSignupFlowVersion(data);
}
