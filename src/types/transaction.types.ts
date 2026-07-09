export interface TransactionCounterparty {
  name: string;
  account_number: string;
  bank: string; // bank code (e.g. "090267")
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  reference?: string;
  date: string;
  status: string;
  amount: number;
  narration?: string;
  counterparty?: TransactionCounterparty;
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
