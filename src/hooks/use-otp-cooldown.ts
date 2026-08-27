import { useEffect, useState } from 'react';

import { ApiError } from '@/services/api';

/** Must stay in sync with the backend's OTP throttle window. */
export const RESEND_SECONDS = 90;

const secondsUntil = (at: number) => Math.max(0, Math.ceil((at - Date.now()) / 1000));

/**
 * The resend countdown shared by the v2 OTP screens.
 *
 * The backend is the real rate limiter (429 + Retry-After); this only mirrors
 * it so the resend link is disabled for roughly as long as the server would
 * refuse anyway. On a 429 the countdown reseeds from the server's own wait
 * time, so the two stay aligned even when they disagree.
 *
 * `sentAt` is when the code being waited on actually went out (Date.now() at
 * request time, kept in the sign-up store alongside the otp id). It matters
 * because the OTP screens are re-entered without sending anything — "Change
 * phone number" → change nothing → Continue lands back here on a code that may
 * already be minutes old. Counting from mount instead would make that user
 * wait a fresh 90s for a resend link on a code that is already dead. Omit it
 * only where the code genuinely goes out as the screen opens.
 *
 * v1 duplicates this logic inline across eight screens. It is not lifted out
 * of them here on purpose — touching the live flow to DRY up the new one is
 * not a trade worth making mid-migration.
 */
export function useOtpCooldown(sentAt?: number) {
  const [expiresAt, setExpiresAt] = useState(
    () => (sentAt || Date.now()) + RESEND_SECONDS * 1000,
  );
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt));

  useEffect(() => {
    setSeconds(secondsUntil(expiresAt));
    // Ticking off wall-clock rather than decrementing a counter: the timer
    // stays honest across a backgrounded app, where the interval stalls.
    const t = setInterval(() => {
      const left = secondsUntil(expiresAt);
      setSeconds(left);
      if (left === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  /** Restart the countdown, preferring the server's Retry-After when given. */
  const start = (retryAfter?: number) =>
    setExpiresAt(
      Date.now() + (retryAfter && retryAfter > 0 ? retryAfter : RESEND_SECONDS) * 1000,
    );

  /** Zero the countdown so the user can retry immediately (used on failures). */
  const clear = () => setExpiresAt(Date.now());

  /**
   * Reseeds the countdown from a 429 and reports whether it handled the error.
   * Callers show their own message for anything else.
   */
  const absorbRateLimit = (err: unknown): err is ApiError => {
    if (err instanceof ApiError && err.status === 429) {
      start(err.retryAfter);
      return true;
    }
    return false;
  };

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`;

  return { seconds, canResend: seconds === 0, timer, start, clear, absorbRateLimit };
}
