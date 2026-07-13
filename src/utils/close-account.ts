import type { CloseAccountBlockerDetails } from '@/types/account.types';
import { formatNairaWhole } from '@/utils/format';

/**
 * Maps a `/account/close` blocker_code to a friendly, actionable message.
 * A "blocked" closure comes back on the success path (HTTP 2xx) — the account
 * was NOT closed because the user still has something to resolve first.
 *
 * Note: available_balance is treated as whole naira (the newer-endpoint
 * convention). If the backend returns kobo, swap formatNairaWhole → formatNaira.
 */
export function getCloseBlockerMessage(
  code?: string | null,
  details?: CloseAccountBlockerDetails | null,
): string {
  switch (code) {
    case 'positive_wallet_balance': {
      const balance =
        typeof details?.available_balance === 'number'
          ? formatNairaWhole(details.available_balance)
          : 'a balance';
      return `You still have ${balance} in your wallet. Please withdraw or transfer your balance before closing your account.`;
    }
    case 'active_loan':
    case 'outstanding_loan':
      return 'You have an active loan. Please repay it in full before closing your account.';
    default:
      return "Your account can't be closed just yet. Please clear any pending balances or obligations, then try again.";
  }
}
