export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  status: string;
  amount: number;
}

export interface RecentTransactionsResponse {
  status: boolean;
  transactions: Transaction[];
}
