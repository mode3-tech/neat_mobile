export const APP_NAME = 'NEAT';

export const NIGERIAN_PHONE_REGEX = /^\+234[789][01]\d{8}$/;
export const BVN_LENGTH = 11;
export const NIN_LENGTH = 11;
export const OTP_LENGTH = 6;
export const PIN_LENGTH = 4;
export const ACCOUNT_NUMBER_LENGTH = 10;
export const NEAT_BANK_CODE = '100040';

// Flat transfer fees in naira. Placeholder values mirrored from the review
// screens — replace with a backend-provided fee if the API starts returning one.
export const TRANSFER_FEE = 10.75;
export const BULK_FEE_PER_RECIPIENT = 10;

export const INSUFFICIENT_FUNDS_MESSAGE =
  'Insufficient funds for this transaction';

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
  ACCOUNT_LIMITS: 'account-limits',
  VAS_CATEGORIES: 'vas-categories',
  VAS_BILLERS: 'vas-billers',
  VAS_PRODUCTS: 'vas-products',
} as const;

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
