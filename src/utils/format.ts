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
 * Format an ISO date string for day-section headers.
 * e.g. "2026-04-03T14:22:00+01:00" → "Thur, 3 Apr 2026"
 */
export const formatSectionDate = (iso: string): string => {
  const d = new Date(iso);
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Format an ISO date string for transaction history rows.
 * e.g. "2026-02-15T15:16:00+01:00" → "Feb 15th, 2026 | 03:16 PM"
 */
export const formatTransactionDateTime = (iso: string): string => {
  const d = new Date(iso);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const day = d.getDate();

  const ordinal = (n: number): string => {
    if (n >= 11 && n <= 13) return `${n}th`;
    const last = n % 10;
    if (last === 1) return `${n}st`;
    if (last === 2) return `${n}nd`;
    if (last === 3) return `${n}rd`;
    return `${n}th`;
  };

  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;

  return `${months[d.getMonth()]} ${ordinal(day)}, ${d.getFullYear()} | ${String(h12).padStart(2, '0')}:${mins} ${ampm}`;
};

/**
 * Format a Nigerian phone number for display.
 */
export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/^\+234/, '0');
};

/**
 * Format an ISO date string as "YYYY/MM/DD".
 */
export const formatDateSlash = (iso: string): string => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}/${mm}/${dd}`;
};

/**
 * Format an ISO date string as "March 21, 2026".
 */
export const formatDateLong = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * Format a Date as "13 Jan, 2026".
 */
export const formatDateShort = (date: Date): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
};
