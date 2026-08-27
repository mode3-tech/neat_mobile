import { useEffect, useState } from 'react';

import { useAccountSummary } from '@/hooks/use-account-summary';

/**
 * Cashback rules for a VAS purchase, shared by all four flows.
 *
 * `amount` is the full price being charged (for cable, package × months).
 * Returns raw numbers rather than formatted strings — airtime formats with its
 * own 2-decimal helper, the other three with `formatNairaWhole`.
 *
 * Calling `useAccountSummary()` here costs nothing: every VAS screen already
 * calls it and TanStack Query dedupes on the shared `account-summary` key.
 */
export function useVasCashback(amount: number) {
  const { data: accountSummary } = useAccountSummary();
  const [useCashback, setUseCashback] = useState(false);

  const balance = accountSummary?.cashback_balance ?? 0;
  // Cashback covers at most the full price, so the payable can reach ₦0.00.
  const available = balance > 0 && amount > 0;
  const applied = available ? Math.min(balance, amount) : 0;
  const payable = useCashback ? amount - applied : amount;

  // Each screen's Proceed button gates on `amount - applied` (the best case), so
  // the sheet opens whenever cashback could cover the gap; this re-checks what
  // the toggle actually leaves payable and blocks Save if it still doesn't fit.
  const payableExceedsBalance =
    accountSummary?.available_balance != null &&
    payable > accountSummary.available_balance;

  // Clearing the amount (or losing the balance) must not leave the toggle armed.
  useEffect(() => {
    if (!available) setUseCashback(false);
  }, [available]);

  return {
    available,
    applied,
    payable,
    useCashback,
    setUseCashback,
    payableExceedsBalance,
  };
}
