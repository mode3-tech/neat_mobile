import type { Href } from 'expo-router';

import type { PushNotificationData } from '@/types/notification.types';

type RouteResolver = (data: Record<string, unknown>) => Href | null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Whitelist of push `event` values → route builders. Each builder validates its
 * own fields and returns a pathname literal owned by the app, so a malformed or
 * hostile payload can never steer navigation to an arbitrary route. Adding a
 * deep link means adding one entry here.
 */
const RESOLVERS: Record<string, RouteResolver> = {
  'statement-ready': (data) => {
    if (!isNonEmptyString(data.job_id)) return null;
    const format =
      data.format === 'pdf' || data.format === 'xlsx' ? data.format : undefined;
    return {
      pathname: '/(account)/statement',
      params: { jobId: data.job_id, ...(format ? { format } : {}) },
    } as Href;
  },
  'credit-alert': (data) => {
    if (!isNonEmptyString(data.transaction_id)) return null;
    return {
      pathname: '/(transaction)/transaction-details',
      params: { id: data.transaction_id },
    } as Href;
  },
};

export const NOTIFICATIONS_FALLBACK: Href = '/notifications';

export function resolveNotificationRoute(
  data: PushNotificationData | undefined,
): Href {
  if (!data || typeof data !== 'object') return NOTIFICATIONS_FALLBACK;
  const bag = data as Record<string, unknown>;

  const event = isNonEmptyString(bag.event) ? bag.event : undefined;
  if (event) {
    const resolved = RESOLVERS[event]?.(bag);
    if (resolved) return resolved;
  }

  // Tolerate a missing or renamed `event` when the payload is unambiguous on
  // its own. The credit-alert discriminator is not yet confirmed against a real
  // payload; matching the id field keeps the link working either way.
  if (isNonEmptyString(bag.transaction_id)) {
    return RESOLVERS['credit-alert'](bag) ?? NOTIFICATIONS_FALLBACK;
  }

  return NOTIFICATIONS_FALLBACK;
}
