import { router } from 'expo-router';

import type { Transaction } from '@/types/transaction.types';

/**
 * Push the Transaction Details screen for a given transaction. The whole
 * transaction is serialized into a single param because the list data already
 * carries every field — no fetch needed on this path. The screen also accepts an
 * `id` param and fetches via `GET /transaction/:id`, which is what notification
 * deep links use since a push can only carry the id.
 */
export function openTransactionDetails(transaction: Transaction): void {
  router.push({
    pathname: '/(transaction)/transaction-details',
    params: { tx: JSON.stringify(transaction) },
  });
}
