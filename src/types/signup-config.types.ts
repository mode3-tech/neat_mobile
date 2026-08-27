/**
 * Shape of `GET /register-version` (public, unauthenticated) — the backend's
 * switch between the v1 and v2 sign-up flows.
 *
 * `version` is typed as a plain string rather than SignupFlowVersion on
 * purpose: this is what the server *said*, not something we trust yet. The
 * narrowing to a known version happens in resolveSignupFlowVersion, which
 * treats anything unrecognized as "no answer".
 */
export interface SignupVersionResponse {
  version?: string;
}
