export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  min_loan_amount: number;
  max_loan_amount: number;
  interest_rate_bps: number;
  repayment_frequency: string;
  grace_period_days: number;
  loan_term_value: number;
  late_penalty_bps: number;
  allows_concurrent_loans: boolean;
  is_active: boolean;
}

export interface LoanEligibility {
  eligible_amount: number;
}

export interface LoanApplyPayload {
  business_address: string;
  business_start_date: string;
  business_value: string;
  loan_amount: string;
  loan_product_type: string;
  transaction_pin: string;
}

export interface LoanApplySummary {
  business_age_years: number;
  business_value: number;
  interest_amount: number;
  interest_rate_percent: number;
  is_estimate: boolean;
  loan_amount: number;
  loan_term_value: number;
  periodic_repayment: number;
  repayment_frequency: string;
  total_repayment: number;
}

export interface LoanApplyResponse {
  application_ref: string;
  loan_status: string;
  message: string;
  summary: LoanApplySummary;
}

export interface ActiveLoan {
  loan_id: string;
  outstanding_balance: number;
  next_payment: number;
  due_date: string;
}

export interface LoanRepayment {
  loan_product_type: string;
  loan_amount: number;
  total_repayment: number;
  periodic_repayment: number;
  loan_duration: string;
  amount_paid: number;
  yet_to_pay: number;
  interest_rate: number;
}

export interface LoanRepaymentResponse {
  status: string;
  message: string;
  repayment: LoanRepayment;
}

export interface ManualRepaymentRequest {
  loan_id: string;
  amount: number;
  transaction_pin: string;
}

export interface ManualRepaymentResponse {
  status: string;
  message: string;
}

export interface LoanStatusItem {
  loan_id: string;
  loan_amount: number;
  balance_remaining: number;
  periodic_payment: number;
  tenure: string;
  interest_rate: number;
  status: string;
}

export interface LoanStatusResponse {
  status: string;
  message: string;
  loans: LoanStatusItem[];
}

export type LoanHistoryStatus = 'paid' | 'upcoming' | 'overdue';

export interface LoanHistoryItem {
  loan_id: string;
  loan_amount: number;
  payment_date: string;
  status: LoanHistoryStatus;
  amount_paid: number;
}

export interface LoanHistoryResponse {
  status: string;
  message: string;
  history: LoanHistoryItem[];
}

export interface LoanDetails {
  total_loan_amount: number;
  amount_repaid: number;
  outstanding_balance: number;
  due_date: string;
}

export interface LoanDetailsResponse {
  status: string;
  message: string;
  details: LoanDetails & {
    repayment_history?: LoanHistoryItem[];
  };
}
