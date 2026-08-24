import { Platform, type PlatformOSType } from 'react-native';
import * as Application from 'expo-application';
import { useQuery } from '@tanstack/react-query';

import { versionService } from '@/services/version.service';
import { QUERY_KEYS } from '@/constants';
import type {
  AppVersionResponse,
  PlatformVersionPolicy,
  VersionGateState,
} from '@/types/app-version.types';

// The backend answer rarely changes, and the AppState listener in _layout.tsx
// invalidates this query on every foreground resume — invalidation overrides
// staleTime, so a generous window here costs us nothing in freshness.
const STALE_TIME_MS = 1000 * 60 * 30; // 30 minutes

/**
 * The endpoint is per-platform, so the policy normally arrives flat. The
 * wrapped fallback keeps an older-shaped payload working — cheap insurance
 * against the gate silently going dead if the backend shape moves.
 */
function selectPolicy(
  data: AppVersionResponse | undefined,
  platform: PlatformOSType,
): PlatformVersionPolicy | undefined {
  if (!data) return undefined;
  if (data.min_build !== undefined || data.latest_build !== undefined) {
    return data as PlatformVersionPolicy;
  }
  return platform === 'ios' ? data.ios : data.android;
}

/**
 * Decide what the gate should show. Pure — `platform` is passed in rather than
 * read from Platform.OS — so the fail-open contract can be unit-tested without
 * a device. See __tests__/use-app-version-gate.test.ts.
 *
 * EVERY uncertain path returns 'ok'. This is a banking app: the gate may only
 * lock someone out on an explicit, well-formed instruction from the backend.
 * A hiccup, a timeout, a missing key, or a garbage number all mean "open".
 *
 * `rawBuild` is Application.nativeBuildVersion — the Android versionCode —
 * NOT nativeApplicationVersion. eas.json uses appVersionSource "remote" with
 * autoIncrement, so `version` stays "1.0.0" across releases and cannot tell
 * two builds apart. Do not "fix" this to compare version names.
 */
export function resolveVersionState(
  data: AppVersionResponse | undefined,
  rawBuild: string | null,
  platform: PlatformOSType,
): VersionGateState {
  // Undefined covers the pending first paint, a request failure and a 5xx —
  // all three render the app.
  if (!data) return 'ok';

  const policy = selectPolicy(data, platform);
  if (!policy) return 'ok';

  // Number(null) and Number('') are both 0, which would read as "ancient build"
  // and hard-block everyone. Reject empty input before converting.
  if (rawBuild === null || rawBuild === undefined || rawBuild.trim() === '') {
    return 'ok';
  }
  const installed = Number(rawBuild);
  if (!Number.isFinite(installed)) return 'ok';

  const min = Number(policy.min_build);
  const latest = Number(policy.latest_build);

  if (Number.isFinite(min) && installed < min) return 'hard';
  if (Number.isFinite(latest) && installed < latest) return 'soft';
  return 'ok';
}

/**
 * `state` is the gate decision; `storeUrl` is the optional backend-supplied
 * listing URL the Update buttons fall back to. Both come from one query, so
 * returning them together avoids a second hook.
 */
export function useAppVersionGate() {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.APP_VERSION],
    queryFn: versionService.getAppVersion,
    staleTime: STALE_TIME_MS,
    // The root QueryClient defaults to retry: 2. A version check is not worth
    // hammering a struggling backend with — one attempt, then fail open.
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ← local testing: the backend still 404s on /app/version/<platform>, so the
  //   gate fails open and neither sheet ever renders. Force a state here to see
  //   them. Set to null (or delete) before pushing. Pairs with the `if (false)`
  //   toggle in components/updates/app-version-gate.tsx.
  // The `as` widens the literal — without it TS narrows the const to 'hard'
  // and flags the downstream 'soft' comparison as unreachable.
  // const FORCE_STATE = 'hard' as VersionGateState | null; // 'soft' | 'hard' | null

  return {
    state: resolveVersionState(
      data,
      Application.nativeBuildVersion,
      Platform.OS,
    ),
    // state:
    //   FORCE_STATE ??
    //   resolveVersionState(data, Application.nativeBuildVersion, Platform.OS),
    storeUrl: selectPolicy(data, Platform.OS)?.store_url,
  };
}
