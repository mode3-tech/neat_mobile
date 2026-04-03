/**
 * Format kobo (integer) to Naira display string.
 * All monetary values are stored as integers (kobo). Never calculate on frontend.
 */
export const formatNaira = (kobo: number): string => {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(naira);
};

/**
 * Format whole-naira amounts (not kobo) to display string.
 */
export const formatNairaWhole = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

/**
 * Format an ISO 8601 date string for transaction display.
 * e.g. "2026-04-02T14:17:23+01:00" → "Apr 2nd, 14:17:23"
 */
export const formatTransactionDate = (iso: string): string => {
  const d = new Date(iso);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();

  const ordinal = (n: number): string => {
    if (n >= 11 && n <= 13) return `${n}th`;
    const last = n % 10;
    if (last === 1) return `${n}st`;
    if (last === 2) return `${n}nd`;
    if (last === 3) return `${n}rd`;
    return `${n}th`;
  };

  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');

  return `${month} ${ordinal(day)}, ${time}`;
};

/**
 * Format a Nigerian phone number for display.
 */
export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/^\+234/, '0');
};
