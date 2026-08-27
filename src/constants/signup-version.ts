/**
 * Sign-up flow versioning.
 *
 * Two complete sign-up flows ship side by side:
 *   v1 — src/app/(sign-up)/      BVN-first, async register (job → poll → claim)
 *   v2 — src/app/(sign-up-v2)/   phone-first, synchronous register
 *
 * The backend picks which one runs via GET /register-version. This is a
 * temporary arrangement — one of the two folders gets deleted once the
 * migration settles, at which point this file and signup-entry.ts go with it.
 */

export type SignupFlowVersion = 'v1' | 'v2';

/**
 * What we fall back to whenever the backend hasn't given us a clear answer:
 * request in flight, network down, 404, 5xx, or a payload we can't parse.
 * v1 is the flow that has been live in production, so an uncertain app is
 * safer pointed at it.
 */
export const DEFAULT_SIGNUP_FLOW_VERSION: SignupFlowVersion = 'v1';

/**
 * Root for the v2 sign-up endpoints (`{host}/api/v2/auth/...`).
 *
 * ONLY the sign-up flow moves to v2. Login, refresh, device binding and every
 * authenticated endpoint stay on /api/v1 — including for users who registered
 * through v2.
 *
 * Derived from the same env var as everything else rather than hardcoded: the
 * host has changed before. (The OpenAPI spec declares a different host in its
 * `servers` block, but the spec is itself served from the host in .env — that
 * block is stale. Trust .env.) Trailing slash and a missing /api/v1 suffix are
 * both tolerated, same as version.service.ts.
 */
export const API_V2_ROOT = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(
  /\/api\/v1\/?$/,
  '/api/v2',
);
