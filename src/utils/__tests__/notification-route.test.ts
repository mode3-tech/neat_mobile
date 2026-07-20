import {
  NOTIFICATIONS_FALLBACK,
  resolveNotificationRoute,
} from '../notification-route';

describe('resolveNotificationRoute', () => {
  describe('credit alerts', () => {
    it('routes to transaction details on the confirmed payload', () => {
      expect(
        resolveNotificationRoute({
          event: 'credit-alert',
          transaction_id: 'txn_123',
        }),
      ).toEqual({
        pathname: '/(transaction)/transaction-details',
        params: { id: 'txn_123' },
      });
    });

    // The backend's `event` value is unconfirmed, so transaction_id alone is
    // enough. This is the fallback that makes a rename non-breaking.
    it('routes on transaction_id even when event is missing', () => {
      expect(resolveNotificationRoute({ transaction_id: 'txn_123' })).toEqual({
        pathname: '/(transaction)/transaction-details',
        params: { id: 'txn_123' },
      });
    });

    it('routes on transaction_id even when event is an unknown string', () => {
      expect(
        resolveNotificationRoute({ event: 'credit', transaction_id: 'txn_123' }),
      ).toEqual({
        pathname: '/(transaction)/transaction-details',
        params: { id: 'txn_123' },
      });
    });

    it('falls back when transaction_id is present but empty', () => {
      expect(
        resolveNotificationRoute({ event: 'credit-alert', transaction_id: '  ' }),
      ).toBe(NOTIFICATIONS_FALLBACK);
    });
  });

  describe('statement-ready (must not regress)', () => {
    it('routes with jobId and format', () => {
      expect(
        resolveNotificationRoute({
          event: 'statement-ready',
          job_id: 'job_1',
          format: 'pdf',
        }),
      ).toEqual({
        pathname: '/(account)/statement',
        params: { jobId: 'job_1', format: 'pdf' },
      });
    });

    it('omits format when absent', () => {
      expect(
        resolveNotificationRoute({ event: 'statement-ready', job_id: 'job_1' }),
      ).toEqual({
        pathname: '/(account)/statement',
        params: { jobId: 'job_1' },
      });
    });

    it('omits an unsupported format rather than passing it through', () => {
      expect(
        resolveNotificationRoute({
          event: 'statement-ready',
          job_id: 'job_1',
          format: 'docx',
        } as never),
      ).toEqual({
        pathname: '/(account)/statement',
        params: { jobId: 'job_1' },
      });
    });

    // The old handler string-built the URL and encodeURIComponent'd the id.
    // expo-router encodes object params itself, so the raw value is correct
    // here — a pre-encoded one would double-encode.
    it('passes the job id through unencoded for expo-router to encode', () => {
      expect(
        resolveNotificationRoute({ event: 'statement-ready', job_id: 'a b&c' }),
      ).toEqual({
        pathname: '/(account)/statement',
        params: { jobId: 'a b&c' },
      });
    });

    it('falls back when job_id is missing', () => {
      expect(resolveNotificationRoute({ event: 'statement-ready' } as never)).toBe(
        NOTIFICATIONS_FALLBACK,
      );
    });
  });

  describe('fallback', () => {
    it.each([
      ['undefined', undefined],
      ['empty object', {}],
      ['unknown event', { event: 'nonsense' }],
      ['non-object', 'oops' as never],
      ['null', null as never],
    ])('falls back to the notifications list for %s', (_label, data) => {
      expect(resolveNotificationRoute(data)).toBe(NOTIFICATIONS_FALLBACK);
    });

    // A payload can never steer navigation to a route of its own choosing.
    it('ignores a server-supplied pathname', () => {
      expect(
        resolveNotificationRoute({
          event: 'nonsense',
          pathname: '/(account)/statement',
          url: '/Dashboard',
        }),
      ).toBe(NOTIFICATIONS_FALLBACK);
    });
  });
});
