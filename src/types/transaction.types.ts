export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  status: string;
  amount: number;
}

export interface TransactionSection {
  month: string;
  transactions: Transaction[];
}

export interface PaginatedTransactionsResponse {
  sections: TransactionSection[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface DaySectionData {
  title: string;
  data: Transaction[];
}

export type TransactionFilter = 'all' | 'credit' | 'debit';
