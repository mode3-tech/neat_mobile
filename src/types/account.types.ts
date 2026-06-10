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
  is_notifications_enabled: boolean;
  profile_picture?: string;
}

export interface AccountLimits {
  activation_cap: {
    active: boolean;
    expires_at?: string; // ISO 8601, present when active
    cap_amount?: number; // kobo
    currency?: string;
  };
  out_flow?: { limit: number; spent: number; remaining: number }; // kobo
  in_flow?: { capped: boolean; limit: number; remaining: number }; // kobo
}

export interface UpdateProfileBody {
  email?: string;
  address?: string;
  profile_picture_uri?: string;
}

export type StatementFormat = 'xlsx' | 'pdf';
export type StatementJobStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface StatementRequestBody {
  format: StatementFormat;
  date_from: string;
  date_to: string;
}

export interface StatementRequestResponse {
  job_id: string;
}

export interface StatementJobStatusResponse {
  job_status: StatementJobStatus;
  download_url?: string;
}
