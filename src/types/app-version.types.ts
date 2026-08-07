/**
 * Shape of `GET /app/version` (public, unauthenticated).
 *
 * `min_build` and `latest_build` are Android versionCodes — NOT the `version`
 * name from app.config.js. See use-app-version-gate.ts for why.
 */
export interface PlatformVersionPolicy {
  min_build: number;
  latest_build: number;
  /** Optional. Treat as a fallback, never assume it is present. */
  store_url?: string;
}

/**
 * The endpoint is per-platform (`/app/version/android`, `/app/version/ios`), so
 * the policy is expected flat at the top level.
 *
 * The optional `android`/`ios` keys keep the older wrapped shape readable too —
 * every field is optional so a payload in either shape parses, and one in
 * neither fails open instead of crashing.
 */
export interface AppVersionResponse extends Partial<PlatformVersionPolicy> {
  android?: PlatformVersionPolicy;
  ios?: PlatformVersionPolicy;
}

export type VersionGateState = 'ok' | 'soft' | 'hard';
