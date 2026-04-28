export const APP_NAME = 'NEAT';

export const NIGERIAN_PHONE_REGEX = /^\+234[789][01]\d{8}$/;
export const BVN_LENGTH = 11;
export const NIN_LENGTH = 11;
export const OTP_LENGTH = 6;
export const PIN_LENGTH = 4;
export const ACCOUNT_NUMBER_LENGTH = 10;
export const NEAT_BANK_CODE = '100040';

export const TOKEN_KEYS = {
  ACCESS: 'neat_access_token',
  REFRESH: 'neat_refresh_token',
} as const;

export const QUERY_KEYS = {
  USER: 'user',
  LOAN: 'loan',
  LOANS: 'loans',
  LOAN_STATUS: 'loan-status',
  LOAN_HISTORY: 'loan-history',
  LOAN_DETAILS: 'loan-details',
  LOAN_HISTORY_BY_ID: 'loan-history-by-id',
  REPAYMENT: 'repayment',
  BANKS: 'banks',
  TRANSACTIONS: 'transactions',
  RECENT_TRANSACTIONS: 'recent-transactions',
  STATEMENT_JOB: 'statement-job',
  ACCOUNT_SUMMARY: 'account-summary',
} as const;

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
