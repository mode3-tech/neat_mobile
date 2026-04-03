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
 * Format a Nigerian phone number for display.
 */
export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/^\+234/, '0');
};
