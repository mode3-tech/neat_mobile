export const APP_NAME = 'NEAT';

export const NIGERIAN_PHONE_REGEX = /^\+234[789][01]\d{8}$/;
export const BVN_LENGTH = 11;
export const NIN_LENGTH = 11;
export const OTP_LENGTH = 6;
export const PIN_LENGTH = 4;

export const TOKEN_KEYS = {
  ACCESS: 'neat_access_token',
  REFRESH: 'neat_refresh_token',
} as const;

export const QUERY_KEYS = {
  USER: 'user',
  LOAN: 'loan',
  LOANS: 'loans',
  REPAYMENT: 'repayment',
} as const;

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
