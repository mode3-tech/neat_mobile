import type { Href } from 'expo-router';

/**
 * A notification tap resolves to a route, but that route often cannot be opened
 * yet — `hydrateTokens()` never restores `isAuthenticated`, so every cold start
 * lands on sign-in regardless of how the app was launched. This module parks the
 * target until the auth store reports a false→true transition, which `_layout`
 * subscribes to. Module scope rather than zustand: it is read and written from
 * outside React and must never trigger a re-render.
 */

/** How long after consuming a link we will still restore it (see `reparkRecentDeepLink`). */
const REPARK_GRACE_MS = 10_000;

let pending: Href | null = null;
let lastConsumed: { href: Href; at: number } | null = null;

/**
 * Notification ids already turned into a route this process. The launch tap is
 * delivered by BOTH `useLastNotificationResponse()` and the response listener,
 * and the hook returns the same object on every render — so the dedupe has to be
 * shared between both entry points and survive remounts, which a ref would not.
 */
const handled = new Set<string>();

/** Returns false if this notification was already routed on this process. */
export function markNotificationHandled(id: string): boolean {
  if (handled.has(id)) return false;
  handled.add(id);
  return true;
}

export function parkDeepLink(href: Href): void {
  pending = href;
}

export function takeDeepLink(): Href | null {
  if (!pending) return null;
  const href = pending;
  pending = null;
  lastConsumed = { href, at: Date.now() };
  return href;
}

/**
 * Restore a link consumed moments ago. On a foreground resume the notification
 * tap and the session-timeout AppState handler both fire with no guaranteed
 * order: if the tap wins, its link is consumed and then `clearAuth()` redirects
 * to sign-in, losing it. Called on auth true→false so either order converges.
 */
export function reparkRecentDeepLink(): void {
  if (pending) return;
  if (lastConsumed && Date.now() - lastConsumed.at < REPARK_GRACE_MS) {
    pending = lastConsumed.href;
    lastConsumed = null;
  }
}

export function clearDeepLink(): void {
  pending = null;
  lastConsumed = null;
}
