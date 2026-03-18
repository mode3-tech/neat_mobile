export interface LoanSummary {
  businessValue: string;
  ageOfBusiness: string;
  loanAmount: number;
  totalRepayment: number;
  weeklyPayment: number;
  loanTerm: number;
  interestRate: number;
  businessAddress: string;
}

export interface LoanProduct {
  id: string;
  name: string;
}

export interface LoanEligibility {
  eligible_amount: number;
}

export interface LoanApplicationPayload {
  businessValue: string;
  businessAge: string;
  businessAddress: string;
  loanProduct: string;
  loanAmount: string;
  repaymentFrequency: string;
}
