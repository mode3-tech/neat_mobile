import type { QueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';

/**
 * Everything that goes stale the moment the user's money moves. Call this after
 * any successful debit or credit — transfer, bulk transfer, VAS purchase,
 * savings deposit, loan repayment.
 *
 * It exists as one function because the balance and the transaction feed had
 * drifted apart: every one of those flows refreshed the balance and none of
 * them refreshed the feed, so a completed transfer landed back on a dashboard
 * showing the new balance above an empty transaction list.
 */
export function refreshAfterMoneyMovement(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_LIMITS] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECENT_TRANSACTIONS] });

  // reset rather than invalidate: TRANSACTIONS is an infinite query, and
  // invalidating one refetches every page the user has already scrolled
  // through. Dropping back to page 1 costs a single request, and the new
  // transaction is on it. Matches what pull-to-refresh does in use-transactions.
  queryClient.resetQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
}
