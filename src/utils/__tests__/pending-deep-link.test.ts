import type { Href } from 'expo-router';

import {
  clearDeepLink,
  markNotificationHandled,
  parkDeepLink,
  reparkRecentDeepLink,
  takeDeepLink,
} from '../pending-deep-link';

const HREF = '/notifications' as Href;
const OTHER = '/Dashboard' as Href;

describe('pending-deep-link', () => {
  beforeEach(() => {
    clearDeepLink();
    jest.useRealTimers();
  });

  describe('park / take', () => {
    it('returns null when nothing is parked', () => {
      expect(takeDeepLink()).toBeNull();
    });

    it('returns the parked link once, then null', () => {
      parkDeepLink(HREF);
      expect(takeDeepLink()).toBe(HREF);
      expect(takeDeepLink()).toBeNull();
    });

    it('keeps only the most recent park', () => {
      parkDeepLink(HREF);
      parkDeepLink(OTHER);
      expect(takeDeepLink()).toBe(OTHER);
    });
  });

  describe('reparkRecentDeepLink', () => {
    // The tap and the session-timeout AppState handler race on a foreground
    // resume. If the tap wins, its link is consumed and clearAuth() then
    // redirects to sign-in — this is what stops the link being lost.
    it('restores a link consumed moments ago', () => {
      parkDeepLink(HREF);
      takeDeepLink();
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBe(HREF);
    });

    it('does not restore a single consume twice', () => {
      parkDeepLink(HREF);
      takeDeepLink();
      reparkRecentDeepLink();
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBe(HREF);
      expect(takeDeepLink()).toBeNull();
    });

    // Each consume is independently re-parkable: if the session times out again
    // after a resume, the user still has not seen the screen, so the link should
    // survive the second round trip too.
    it('restores again after a subsequent consume', () => {
      parkDeepLink(HREF);
      takeDeepLink();
      reparkRecentDeepLink();
      takeDeepLink();
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBe(HREF);
    });

    it('does not clobber a link parked in the meantime', () => {
      parkDeepLink(HREF);
      takeDeepLink();
      parkDeepLink(OTHER);
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBe(OTHER);
    });

    it('is a no-op when nothing was ever consumed', () => {
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBeNull();
    });

    it('does not restore a link consumed outside the grace window', () => {
      jest.useFakeTimers();
      parkDeepLink(HREF);
      takeDeepLink();
      jest.advanceTimersByTime(10_001);
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBeNull();
    });

    it('does not restore after clearDeepLink', () => {
      parkDeepLink(HREF);
      takeDeepLink();
      clearDeepLink();
      reparkRecentDeepLink();
      expect(takeDeepLink()).toBeNull();
    });
  });

  describe('markNotificationHandled', () => {
    // The launch tap arrives via BOTH useLastNotificationResponse() and the
    // response listener, and the hook re-fires on remount.
    it('returns true once per id, false thereafter', () => {
      const id = `notif_${Date.now()}_a`;
      expect(markNotificationHandled(id)).toBe(true);
      expect(markNotificationHandled(id)).toBe(false);
      expect(markNotificationHandled(id)).toBe(false);
    });

    it('tracks ids independently', () => {
      const a = `notif_${Date.now()}_b`;
      const b = `notif_${Date.now()}_c`;
      expect(markNotificationHandled(a)).toBe(true);
      expect(markNotificationHandled(b)).toBe(true);
      expect(markNotificationHandled(a)).toBe(false);
    });
  });
});
