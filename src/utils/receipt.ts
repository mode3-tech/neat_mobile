import * as Sharing from 'expo-sharing';

import { formatNairaDecimal } from './format';

/**
 * The amount breakdown rows for a receipt: what was sent, what it cost, what
 * left the account. Shared by the post-transfer receipt and the one reopened
 * from transaction history so the two can't drift.
 *
 * `total` is optional — the transfer response carries one, transaction history
 * returns charges/vat without it, so it's derived when missing.
 *
 * Returns [] for credits: money coming in isn't charged, so any charges/vat the
 * backend echoes on such a row belong to the sender's side of the transfer, and
 * the "Total Debited" wording would state the wrong direction of funds outright.
 * The header already shows the amount, so there's nothing left to break down.
 *
 * Also returns [] when a debit carries no fee fields at all, since a lone
 * "Amount" row would just repeat the header. Non-finite fields are dropped
 * rather than printed as ₦0.00 on a receipt the user may forward; zero VAT is
 * dropped as noise, zero charges kept — "no fee" is worth stating.
 */
export function buildAmountRows({
  amount,
  charges,
  vat,
  total,
  isCredit = false,
}: {
  amount: number;
  charges?: number;
  vat?: number;
  total?: number;
  isCredit?: boolean;
}): { label: string; value: string }[] {
  if (isCredit) return [];

  const hasCharges = Number.isFinite(charges);
  const hasVat = Number.isFinite(vat);
  if (!hasCharges && !hasVat) return [];

  const resolvedTotal = Number.isFinite(total)
    ? (total as number)
    : amount + (hasCharges ? (charges as number) : 0) + (hasVat ? (vat as number) : 0);

  return [
    { label: 'Amount', value: amount },
    ...(hasCharges ? [{ label: 'Charges', value: charges as number }] : []),
    ...(hasVat && vat !== 0 ? [{ label: 'VAT', value: vat as number }] : []),
    { label: 'Total Debited', value: resolvedTotal },
  ]
    .filter((r) => Number.isFinite(r.value))
    .map((r) => ({ label: r.label, value: formatNairaDecimal(r.value) }));
}

/**
 * Wrap a captured receipt image (a PNG data-URI from react-native-view-shot)
 * in minimal HTML so expo-print can render it to a PDF that is pixel-identical
 * to the on-screen receipt — logo included. The on-screen card is the single
 * source of truth; we never re-implement the receipt layout in HTML.
 */
export function buildReceiptHtml(imageDataUri: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; padding: 24px; }
    img { display: block; width: 100%; max-width: 480px; margin: 0 auto; }
  </style>
</head>
<body>
  <img src="${imageDataUri}" />
</body>
</html>`;
}

export async function shareFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri);
}
