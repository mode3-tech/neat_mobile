import { Share } from 'react-native';

import { INVITE_URL } from '@/constants';

function buildInviteLink(code: string): string {
  // Built by hand rather than with URL/searchParams: React Native's URL polyfill
  // does not implement searchParams, so url.searchParams.set is a silent no-op.
  const separator = INVITE_URL.includes('?') ? '&' : '?';
  return `${INVITE_URL}${separator}ref=${encodeURIComponent(code)}`;
}

export function buildReferralMessage(code: string): string {
  return [
    'Join me on NEATPay 🎉',
    '',
    'Access funds fast, send money, buy airtime and data, and pay bills — all in one app.',
    `Sign up with my referral code ${code}.`,
    '',
    buildInviteLink(code),
  ].join('\n');
}

export async function shareReferral(code: string): Promise<void> {
  if (!code) return;

  try {
    // The link goes inside `message` — never Share's separate `url` field. On
    // iOS most share targets take `url` and drop `message`, which would send
    // the friend a bare download link with no code attached.
    await Share.share({ message: buildReferralMessage(code) });
  } catch {
    // Backing out of the sheet is not a failure worth surfacing.
  }
}
