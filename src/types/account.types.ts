export interface ActiveLoan {
  loan_id: string;
  loan_number: string;
  loan_amount: number;
  total_repayment: number;
  monthly_repayment: number;
  next_due_date: string;
}

export interface AccountSummary {
  full_name: string;
  phone_number: string;
  dob: string;
  address: string;
  bvn: string;
  email?: string;
  bank_name: string;
  wallet_id: string;
  account_number: string;
  available_balance: number;
  loan_balance: number;
  active_loans: ActiveLoan[];
}

export interface UpdateProfileBody {
  email?: string;
  address?: string;
}

export interface AccountSummaryResponse {
  status: boolean;
  data: AccountSummary;
}

export type StatementFormat = 'xlsx' | 'pdf';
export type StatementJobStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface StatementRequestBody {
  format: StatementFormat;
  date_from: string;
  date_to: string;
}

export interface StatementRequestResponse {
  status: boolean;
  message: string;
  job_id: string;
}

export interface StatementJobStatusResponse {
  status: boolean;
  job_status: StatementJobStatus;
  download_url?: string;
}
