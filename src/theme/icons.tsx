/**
 * Icon tokens.
 *
 * Every icon in the app renders through `<Icon />`, and every icon name is
 * declared here. Screens never import an icon library directly, so Stage 2 of
 * the redesign can change the whole icon set — including moving to custom SVGs —
 * by editing this file alone.
 *
 * Naming rule: tokens are named by MEANING, not by the glyph they happen to use
 * today (`back`, not `chevronLeft`). Where two tokens draw the same concept, the
 * second carries a role suffix saying where it is used (`copy` / `copyBalance`).
 * Never a library suffix — Stage 2 may change the library, and the name would
 * then lie.
 *
 * `as const satisfies Record<string, IconDef>` does the work: the glyph string is
 * checked against the right library's glyphMap when you add a token, and
 * `keyof typeof ICONS` stays a literal union so a typo at a call site is a
 * compile error.
 *
 * KNOWN DUPLICATES — ten concepts are drawn twice, six of them by two different
 * libraries. They are kept apart because collapsing any pair would change what
 * renders, which Stage 1 forbids. Stage 2 should decide which survives:
 *
 *   reveal/hide   eye / eyeOff (mci, 7 PIN fields)     vs eyeBalance / eyeOffBalance (ion)
 *   copy          copy (mci, receipts + details)       vs copyBalance (feather)
 *   success tick  check / checkCircle (mci)            vs successTick / successCircle (ion)
 *   plus          plus (mci, steppers)                 vs plusAction (feather, Deposit button)
 *   send          send (mci, bulk transfer card)       vs sendAction (feather, Send Money button)
 *   bell          bell (mci, profile row)              vs bellHeader (ion, dashboard header)
 *   shield        shieldLock (mci, notification chip)  vs shield (ion, device blocked)
 *   calendar      calendar (mci, apply-loan)           vs calendarBlank (mci, statement)
 *   sign out      logout (mci, confirm modal)          vs power (mci, profile row)
 *   excel         excel (mci, statement picker)        vs excelSheet (mci, bulk transfer)
 *
 * Also note `betting` (trophy) is what the dashboard's "Buy Airtime" tile uses,
 * while transaction rows use `tabSupport` (phone) for airtime. Pre-existing.
 *
 * STAGE 2: remap the `name` values below, or replace the body of `Icon` with an
 * SVG registry keyed by the same token names. Nothing outside this file changes.
 */

import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

type IconDef =
  | { lib: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap }
  | { lib: 'ion'; name: keyof typeof Ionicons.glyphMap }
  | { lib: 'feather'; name: keyof typeof Feather.glyphMap };

export const ICONS = {
  // ── Navigation & chrome ──────────────────────────────────────────────────
  back: { lib: 'mci', name: 'chevron-left' },
  chevronRight: { lib: 'mci', name: 'chevron-right' },
  chevronDown: { lib: 'mci', name: 'chevron-down' },
  close: { lib: 'mci', name: 'close' },
  clear: { lib: 'mci', name: 'close-circle' },
  more: { lib: 'mci', name: 'dots-horizontal' },
  arrowForward: { lib: 'ion', name: 'arrow-forward' },

  // ── Tab bar ──────────────────────────────────────────────────────────────
  tabHome: { lib: 'mci', name: 'home' },
  tabTransactions: { lib: 'mci', name: 'receipt' },
  tabLoan: { lib: 'mci', name: 'wallet' },
  tabProfile: { lib: 'mci', name: 'account-circle' },
  tabSupport: { lib: 'mci', name: 'phone' },

  // ── Identity ─────────────────────────────────────────────────────────────
  user: { lib: 'mci', name: 'account-circle-outline' },
  userSettings: { lib: 'mci', name: 'account-outline' },
  userAdd: { lib: 'mci', name: 'account-plus-outline' },
  idCard: { lib: 'mci', name: 'card-account-details-outline' },

  // ── Success & confirmation ───────────────────────────────────────────────
  check: { lib: 'mci', name: 'check' },
  checkCircle: { lib: 'mci', name: 'check-circle' },
  verified: { lib: 'mci', name: 'check-decagram' },
  successTick: { lib: 'ion', name: 'checkmark' },
  successCircle: { lib: 'ion', name: 'checkmark-circle' },

  // ── Alert & info ─────────────────────────────────────────────────────────
  alert: { lib: 'mci', name: 'alert' },
  alertCircle: { lib: 'mci', name: 'alert-circle-outline' },
  exclamation: { lib: 'mci', name: 'exclamation-thick' },
  info: { lib: 'mci', name: 'information' },
  infoOutline: { lib: 'mci', name: 'information-outline' },

  // ── Security & auth ──────────────────────────────────────────────────────
  eye: { lib: 'mci', name: 'eye-outline' },
  eyeOff: { lib: 'mci', name: 'eye-off-outline' },
  eyeBalance: { lib: 'ion', name: 'eye-outline' },
  eyeOffBalance: { lib: 'ion', name: 'eye-off-outline' },
  faceId: { lib: 'mci', name: 'face-recognition' },
  fingerprint: { lib: 'mci', name: 'fingerprint' },
  lock: { lib: 'mci', name: 'lock-outline' },
  key: { lib: 'mci', name: 'key-outline' },
  shield: { lib: 'ion', name: 'shield-outline' },
  shieldLock: { lib: 'mci', name: 'shield-lock-outline' },

  // ── Money & transactions ─────────────────────────────────────────────────
  transfer: { lib: 'mci', name: 'bank-transfer' },
  swap: { lib: 'mci', name: 'swap-horizontal' },
  sortDirection: { lib: 'mci', name: 'swap-vertical' },
  repeatTransfer: { lib: 'mci', name: 'repeat' },
  refund: { lib: 'mci', name: 'arrow-u-left-top' },
  loans: { lib: 'mci', name: 'cash-multiple' },
  loanPending: { lib: 'mci', name: 'cash-clock' },
  walletOutline: { lib: 'mci', name: 'wallet-outline' },
  meterCard: { lib: 'mci', name: 'card-outline' },

  // ── VAS categories ───────────────────────────────────────────────────────
  data: { lib: 'mci', name: 'wifi' },
  electricity: { lib: 'mci', name: 'flash' },
  cableTv: { lib: 'mci', name: 'television' },
  betting: { lib: 'mci', name: 'trophy' },
  reward: { lib: 'mci', name: 'gift' },
  qrCode: { lib: 'mci', name: 'qrcode-scan' },

  // ── Documents & media ────────────────────────────────────────────────────
  document: { lib: 'mci', name: 'file-document-outline' },
  pdf: { lib: 'mci', name: 'file-pdf-box' },
  excel: { lib: 'mci', name: 'file-excel-box' },
  excelSheet: { lib: 'mci', name: 'file-excel-outline' },
  download: { lib: 'mci', name: 'download' },
  image: { lib: 'mci', name: 'image-outline' },
  plan: { lib: 'mci', name: 'package-variant' },
  bundle: { lib: 'mci', name: 'cube-outline' },

  // ── Actions ──────────────────────────────────────────────────────────────
  search: { lib: 'mci', name: 'magnify' },
  copy: { lib: 'mci', name: 'content-copy' },
  copyBalance: { lib: 'feather', name: 'copy' },
  share: { lib: 'mci', name: 'share-variant' },
  refresh: { lib: 'mci', name: 'refresh' },
  plus: { lib: 'mci', name: 'plus' },
  plusAction: { lib: 'feather', name: 'plus' },
  minus: { lib: 'mci', name: 'minus' },
  send: { lib: 'mci', name: 'send' },
  sendAction: { lib: 'feather', name: 'send' },
  trash: { lib: 'mci', name: 'trash-can-outline' },
  logout: { lib: 'mci', name: 'logout' },
  power: { lib: 'mci', name: 'power' },
  camera: { lib: 'mci', name: 'camera' },
  calendar: { lib: 'mci', name: 'calendar' },
  calendarBlank: { lib: 'mci', name: 'calendar-blank-outline' },

  // ── Forms ────────────────────────────────────────────────────────────────
  radioOn: { lib: 'mci', name: 'radiobox-marked' },
  radioOff: { lib: 'mci', name: 'radiobox-blank' },

  // ── Notifications & connectivity ─────────────────────────────────────────
  bell: { lib: 'mci', name: 'bell-outline' },
  bellOff: { lib: 'mci', name: 'bell-off-outline' },
  bellHeader: { lib: 'ion', name: 'notifications-outline' },
  announcement: { lib: 'mci', name: 'bullhorn-outline' },
  offline: { lib: 'mci', name: 'wifi-off' },
  updateAvailable: { lib: 'ion', name: 'arrow-up-circle-outline' },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 24, color, style }: IconProps): React.JSX.Element {
  const def: IconDef = ICONS[name];

  // Switching on `lib` narrows the union, so each library gets its own glyph
  // name type. That is what keeps this file cast-free.
  switch (def.lib) {
    case 'ion':
      return <Ionicons name={def.name} size={size} color={color} style={style} />;
    case 'feather':
      return <Feather name={def.name} size={size} color={color} style={style} />;
    default:
      return <MaterialCommunityIcons name={def.name} size={size} color={color} style={style} />;
  }
}
