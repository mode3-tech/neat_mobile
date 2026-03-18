import type {
  LoanApplicationPayload,
  LoanEligibility,
  LoanProduct,
  LoanSummary,
} from '@/types/loan.types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const loanService = {
  getEligibility: async (): Promise<LoanEligibility> => {
    await delay(800);
    return { eligible_amount: 500000 };
  },

  getLoanProducts: async (): Promise<LoanProduct[]> => {
    await delay(500);
    return [
      { id: '1', name: 'Group Loan' },
      { id: '2', name: 'Individual Loan' },
      { id: '3', name: 'Business Loan' },
      { id: '4', name: 'Salary Loan' },
    ];
  },

  calculateLoan: async (payload: LoanApplicationPayload): Promise<LoanSummary> => {
    await delay(1000);
    const amount = parseFloat(payload.loanAmount) || 80000;
    const interestRate = 0.24;
    const loanTerm = 24;
    const totalRepayment = amount * (1 + interestRate / 100 * loanTerm);
    const weeklyPayment = totalRepayment / loanTerm;

    return {
      businessValue: payload.businessValue || 'Rent Payment',
      ageOfBusiness: payload.businessAge || 'N/A',
      loanAmount: amount,
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      weeklyPayment: Math.round(weeklyPayment * 100) / 100,
      loanTerm,
      interestRate,
      businessAddress: payload.businessAddress || 'Kaduna 1: Suite 501 2nd floor, NUT Building, Mogadishu Layout, Kaduna.',
    };
  },

  submitApplication: async (_pin: string): Promise<{ message: string }> => {
    await delay(1200);
    return { message: 'Loan application submitted successfully' };
  },
};
