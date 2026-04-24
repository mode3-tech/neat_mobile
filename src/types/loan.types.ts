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

export interface Loan {
  loan_id: string;
  loan_number: string;
  principal_amount: number;
  disbursed_amount: number;
  outstanding_balance: number;
  status: string;
  next_due_date: string;
  next_due_amount: number;
}
