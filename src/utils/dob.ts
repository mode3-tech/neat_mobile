/**
 * Date-of-birth helpers for the v2 sign-up flow.
 *
 * v2 collects DOB by typed digits rather than a spinner: a birth date is
 * decades in the past, and scrolling a picker that far is slower and more
 * error-prone than typing eight numbers.
 *
 * The user types DDMMYYYY (displayed as DD/MM/YYYY); the backend wants
 * YYYY-MM-DD.
 */

/** Insert slashes as the user types. Input is digits only, max 8. */
export function formatDobInput(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Convert a DD/MM/YYYY string to the backend's YYYY-MM-DD, or null if it isn't
 * a real date.
 *
 * The round-trip check catches dates that parse but don't exist — JS rolls
 * 31/02 forward to 03 March rather than failing, so comparing the components
 * back out is the only way to reject it.
 */
export function toIsoDob(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 1900) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  // A birth date in the future is always a typo. Any stricter age rule is the
  // backend's to enforce — it knows the account-opening policy, we don't.
  if (date.getTime() > Date.now()) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** YYYY-MM-DD back to DD/MM/YYYY, for repopulating the field on back-nav. */
export function fromIsoDob(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}
