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
  account_number: string;
  available_balance: number;
  loan_balance: number;
  active_loans: ActiveLoan[];
}

export interface AccountSummaryResponse {
  status: boolean;
  data: AccountSummary;
}
