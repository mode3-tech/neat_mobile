import type { SignupFlowVersion } from '@/constants/signup-version';

/**
 * The single fork between the two sign-up flows.
 *
 * Everything downstream of this route lives entirely inside one route group,
 * so this function plus useSignupFlowVersion is the whole switch — there is no
 * version branching inside any screen. When one of the two flows is deleted,
 * this file and the version constant go with it and the call sites go back to
 * a literal route.
 */
export function signupEntryRoute(version: SignupFlowVersion): string {
  return version === 'v2'
    ? '/(sign-up-v2)/phone-validation'
    : '/(sign-up)/bvn-verification';
}
