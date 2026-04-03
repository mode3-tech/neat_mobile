import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ActiveLoanCard from '../ActiveLoanCard';
import type { ActiveLoan } from '@/types/account.types';

const mockLoan: ActiveLoan = {
  loan_id: 'LN-001',
  loan_number: '20240001',
  loan_amount: 50000,
  total_repayment: 57500,
  monthly_repayment: 19166.67,
  next_due_date: '2026-05-01',
};

describe('ActiveLoanCard', () => {
  it('renders nothing when loans array is empty', () => {
    const { toJSON } = render(<ActiveLoanCard loans={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders the section title', () => {
    render(<ActiveLoanCard loans={[mockLoan]} />);
    expect(screen.getByText('Active Loan')).toBeTruthy();
  });

  it('displays formatted loan amount', () => {
    render(<ActiveLoanCard loans={[mockLoan]} />);
    expect(screen.getByText('Loan Amount')).toBeTruthy();
    expect(screen.getByText('₦50,000.00')).toBeTruthy();
  });

  it('displays formatted total repayment', () => {
    render(<ActiveLoanCard loans={[mockLoan]} />);
    expect(screen.getByText('Total Repayment')).toBeTruthy();
    expect(screen.getByText('₦57,500.00')).toBeTruthy();
  });

  it('displays formatted monthly payment', () => {
    render(<ActiveLoanCard loans={[mockLoan]} />);
    expect(screen.getByText('Monthly Payment')).toBeTruthy();
    expect(screen.getByText('₦19,166.67')).toBeTruthy();
  });

  it('renders the View Settlement button', () => {
    render(<ActiveLoanCard loans={[mockLoan]} />);
    expect(screen.getByText('View Settlement')).toBeTruthy();
  });

  it('only renders the first loan when multiple are provided', () => {
    const secondLoan: ActiveLoan = {
      ...mockLoan,
      loan_id: 'LN-002',
      loan_amount: 100000,
    };
    render(<ActiveLoanCard loans={[mockLoan, secondLoan]} />);
    // First loan's amount should show, not the second
    expect(screen.getByText('₦50,000.00')).toBeTruthy();
    expect(screen.queryByText('₦100,000.00')).toBeNull();
  });
});
