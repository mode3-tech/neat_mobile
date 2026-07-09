import { router } from 'expo-router';

import type { Transaction } from '@/types/transaction.types';

/**
 * Push the Transaction Details screen for a given transaction. The whole
 * transaction is serialized into a single param since there is no
 * fetch-by-id endpoint — the list data already carries every field.
 */
export function openTransactionDetails(transaction: Transaction): void {
  router.push({
    pathname: '/(transaction)/transaction-details',
    params: { tx: JSON.stringify(transaction) },
  });
}
