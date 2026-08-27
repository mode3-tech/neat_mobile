import { BVN_LENGTH, NIN_LENGTH } from '@/constants';

import { toIsoDob } from './dob';

/**
 * Field validators for the v2 sign-up forms.
 *
 * Each returns an error message or '' when the value is acceptable, so screens
 * can render the message directly and treat '' as valid. Keeping them here
 * rather than inline per screen keeps the wording consistent — the same
 * mistake should not be described three different ways.
 */

/**
 * Nigerian mobile numbers, local 11-digit form: 0 + network code + 8 digits.
 * The network codes in service are 70x, 71x, 80x, 81x, 90x and 91x, which is
 * what [789][01] covers — the same rule as NIGERIAN_PHONE_REGEX in constants,
 * expressed for the 0-prefixed form v2's API expects.
 */
export const LOCAL_PHONE_REGEX = /^0[789][01]\d{8}$/;
export const PHONE_LENGTH = 11;
/** 234 + 10 digits — the longest thing normalizePhone can still repair. */
const INTL_DIGITS = 13;
/**
 * maxLength for the phone field: INTL_DIGITS plus the leading '+' a paste can
 * carry. Capping it at PHONE_LENGTH instead would truncate +2348031234567
 * mid-number, leaving a value normalizePhone has no way to recover.
 */
export const PHONE_INPUT_MAX_LENGTH = INTL_DIGITS + 1;

/**
 * Accept the ways people actually type a Nigerian number — +2348031234567,
 * 2348031234567, 8031234567 — and return the 0-prefixed form the backend
 * wants. Anything else is passed through for the validator to reject.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('234')) {
    // Held at full length while the rest of the number is still being typed;
    // truncating to PHONE_LENGTH here would strand it at 11 digits and the
    // country code would never be stripped.
    return digits.length >= INTL_DIGITS
      ? `0${digits.slice(3, INTL_DIGITS)}`
      : digits;
  }
  // A bare 10-digit number missing its leading zero (typed after a +234 habit).
  if (digits.length === 10 && /^[789][01]/.test(digits)) {
    return `0${digits}`;
  }
  return digits.slice(0, PHONE_LENGTH);
}

export function validatePhone(phone: string): string {
  if (!phone) return 'Please enter your phone number';
  if (phone.length < PHONE_LENGTH) return 'Phone number must be 11 digits';
  if (!LOCAL_PHONE_REGEX.test(phone)) {
    return 'Enter a valid Nigerian mobile number, e.g. 08031234567';
  }
  return '';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return 'Please enter your email address';
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Enter a valid email address, e.g. name@example.com';
  }
  return '';
}

export function validateBvn(bvn: string): string {
  if (!bvn) return 'Please enter your BVN';
  if (bvn.length !== BVN_LENGTH) return `BVN must be ${BVN_LENGTH} digits`;
  return '';
}

export function validateNin(nin: string): string {
  if (!nin) return 'Please enter your NIN';
  if (nin.length !== NIN_LENGTH) return `NIN must be ${NIN_LENGTH} digits`;
  return '';
}

export function validateDob(display: string): string {
  const digits = display.replace(/\D/g, '');
  if (!digits) return 'Please enter your date of birth';
  if (digits.length < 8) return 'Enter your date of birth as DD/MM/YYYY';
  if (!toIsoDob(display)) return "That date doesn't exist. Please check it";
  return '';
}

/** Names, maiden name, and anything else that just needs to be filled in. */
export function validateName(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) return `Please enter your ${label}`;
  if (trimmed.length < 2) return `${label} looks too short`;
  if (!/^[a-zA-Z][a-zA-Z\s'-]*$/.test(trimmed)) {
    return `${label} can only contain letters, hyphens and apostrophes`;
  }
  return '';
}

export function validateRequired(value: string, message: string): string {
  return value.trim() ? '' : message;
}

export function validateAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return 'Please enter your street address';
  if (trimmed.length < 5) return 'Please enter your full street address';
  return '';
}
