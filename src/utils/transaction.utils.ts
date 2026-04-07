import type {
  Transaction,
  DaySectionData,
  TransactionFilter,
} from '@/types/transaction.types';
import { formatSectionDate } from './format';

/**
 * Groups a flat transaction array by calendar day for SectionList.
 * Uses local date methods to respect the device timezone.
 */
export function groupTransactionsByDay(
  transactions: Transaction[],
): DaySectionData[] {
  const map = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const existing = map.get(dateKey);
    if (existing) {
      existing.push(tx);
    } else {
      map.set(dateKey, [tx]);
    }
  }

  return Array.from(map.entries()).map(([, txs]) => ({
    title: formatSectionDate(txs[0].date),
    data: txs,
  }));
}

/**
 * Applies client-side filter (All/Credit/Debit) and search query.
 */
export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
  searchQuery: string,
): Transaction[] {
  let result = transactions;

  if (filter !== 'all') {
    result = result.filter((tx) => tx.type === filter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q),
    );
  }

  return result;
}
