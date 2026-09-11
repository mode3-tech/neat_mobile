import { useEffect, useState } from 'react';
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

// Upper bound on how long "Create account" stays disabled. The request has an
// 8s timeout and one retry, so without this a cold backend could leave the
// button dead for 16s. After the cap we proceed on the default and let the
// request finish in the background — a later tap still picks up the answer.
export const MAX_WAIT_MS = 3000;

/**
 * Narrow the backend's answer to a version we actually have screens for.
 *
 * Pure and exported so the fallback contract can be unit-tested without a
 * device — see __tests__/use-signup-flow-version.test.ts.
 *
 * Undefined here means the request FAILED, not that it is pending — the hook
 * reports pending separately so callers wait rather than guess. An
 * unrecognized string covers a future 'v3' this build has no screens for;
 * routing there would dead-end at a blank screen.
 */
export function resolveSignupFlowVersion(
  data: SignupVersionResponse | undefined,
): SignupFlowVersion {
  if (data?.version === 'v1' || data?.version === 'v2') return data.version;
  return DEFAULT_SIGNUP_FLOW_VERSION;
}

export interface SignupFlowVersionState {
  version: SignupFlowVersion;
  /** True only while we have no answer yet and the wait cap hasn't elapsed. */
  isPending: boolean;
}

/**
 * Which sign-up flow to enter. Safe to call before sign-in.
 *
 * Callers must gate the entry button on `isPending`. The bug this replaces
 * treated the pending first render as "no answer, use the default" and sent
 * anyone who tapped inside the round-trip into the wrong flow.
 *
 * Someone already partway through a flow stays in it even if the flag flips
 * behind them — their half-filled store and verification ids belong to it.
 */
export function useSignupFlowVersion(): SignupFlowVersionState {
  const { data, isPending: queryPending } = useQuery({
    queryKey: [QUERY_KEYS.SIGNUP_FLOW_VERSION],
    queryFn: signupConfigService.getSignupVersion,
    staleTime: STALE_TIME_MS,
    // One retry over the root client's two: the button is gated on this, so
    // a transient blip is worth a second attempt, but the wait cap below is
    // what actually bounds the user's wait — not the retry count.
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [capElapsed, setCapElapsed] = useState(false);

  useEffect(() => {
    if (!queryPending) return;
    const timer = setTimeout(() => setCapElapsed(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, [queryPending]);

  // ← local testing: force a flow without touching the backend. Set back to
  //   null (or leave commented) before pushing.
  //   The `as` widens the literal — without it TS narrows the const and flags
  //   the other branch as unreachable.
  // const FORCE_VERSION = 'v2' as SignupFlowVersion | null; // 'v1' | 'v2' | null
  // if (FORCE_VERSION) return { version: FORCE_VERSION, isPending: false };

  return {
    version: resolveSignupFlowVersion(data),
    isPending: queryPending && !capElapsed,
  };
}
