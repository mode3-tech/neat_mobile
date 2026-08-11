/**
 * Image tokens.
 *
 * Every `require()`d image in the app lives here, and screens reference them by
 * ROLE (`images.loanCard`) rather than by filename and relative path
 * (`'../../../../assets/images/dashboard/bag.png'`). Stage 2 of the redesign
 * swaps the artwork by editing the paths below — nothing else changes.
 *
 * Naming rule, same as icons.tsx: tokens are named by MEANING, not by the file
 * that happens to back them today. `loanCard`, not `pig`; `balanceCard.savings`,
 * not `bag`. Reused artwork gets ONE key so a Stage 2 swap hits every usage at
 * once — `logo` covers five screens, `loanCard` covers four.
 *
 * REQUIRES MUST STAY STATIC STRING LITERALS. Metro collects `require(<literal>)`
 * at build time and cannot resolve a computed or templated path — a built path
 * fails at runtime, not at compile time. Do not "DRY up" the repeated
 * `'../../assets/images/'` prefix into a variable.
 *
 * TYPING: the object is annotated with `ImageTokens` rather than using
 * `as const satisfies` like icons.tsx does, because `require()` is typed `any` —
 * `satisfies` would wave anything through and leave every `images.*` as `any`.
 * The explicit annotation makes a typo an error at the definition AND at every
 * call site, and gives each value a real `ImageSourcePropType`.
 *
 * ASSET FILENAMES ARE NOT TOUCHED BY STAGE 1 — renaming is a Stage 2 concern.
 * Note `'New Notification.png'` has a space in it; rename it when the artwork is
 * replaced, not before.
 *
 * NOT COVERED HERE: the app icon, Android adaptive icon, native splash image and
 * notification icon. Those are declared in `app.config.js`, sit outside the
 * bundler, and are handled in Stage 2 Task 12 — changing them needs a native
 * rebuild.
 */

import type { ImageSourcePropType } from 'react-native';

interface ImageTokens {
  /** NEAT brand mark: sign-in, dashboard header, transfer success, receipt. */
  logo: ImageSourcePropType;
  /**
   * The JS splash screen's mark. Deliberately a separate token from `logo` even
   * though both point at the same file today: `app.config.js` sets the NATIVE
   * splash to this same asset, and `components/ui/splash-screen.tsx` relies on
   * the two being identical so the native→JS hand-off doesn't blink. Change this
   * and you must change `expo-splash-screen.image` in `app.config.js` with it
   * (Stage 2 Task 12, native rebuild required).
   */
  splashLogo: ImageSourcePropType;
  /** Welcome carousel, in slide order. Index 3 is `frame.png`, not `frame4`. */
  onboarding: readonly [
    ImageSourcePropType,
    ImageSourcePropType,
    ImageSourcePropType,
    ImageSourcePropType,
  ];
  /** Alternative sign-in mark. Referenced only from a commented-out call site. */
  signIn: ImageSourcePropType;
  /** Sign-up phone-validation illustration. */
  phoneVerify: ImageSourcePropType;
  /** New-device-detected illustration. */
  deviceVerify: ImageSourcePropType;
  /** Loan balance card decoration — empty, skeleton, active, and loan details. */
  loanCard: ImageSourcePropType;
  /** Loan-status screen, shown when the user has no loans. */
  loanStatusEmpty: ImageSourcePropType;
  /** Add-money funding options. */
  deposit: {
    bank: ImageSourcePropType;
    card: ImageSourcePropType;
    cards: ImageSourcePropType;
  };
  /** Dashboard balance-card carousel, keyed by card id. */
  balanceCard: {
    available: ImageSourcePropType;
    /** Referenced only from the commented-out savings card. */
    savings: ImageSourcePropType;
    loan: ImageSourcePropType;
  };
  /** Dashboard promo banner. */
  promo: ImageSourcePropType;
  /** Dashboard recent-transactions empty state. */
  recentEmpty: ImageSourcePropType;
}

export const images: ImageTokens = {
  // ── Brand ────────────────────────────────────────────────────────────────
  logo: require('../../assets/images/welcome/NeatLogo.png'),
  splashLogo: require('../../assets/images/welcome/NeatLogo.png'),

  // ── Onboarding ───────────────────────────────────────────────────────────
  onboarding: [
    require('../../assets/images/welcome/frame1.png'),
    require('../../assets/images/welcome/frame2.png'),
    require('../../assets/images/welcome/frame3.png'),
    require('../../assets/images/welcome/frame.png'),
  ],

  // ── Auth & verification ──────────────────────────────────────────────────
  signIn: require('../../assets/images/sign.png'),
  phoneVerify: require('../../assets/images/fone.png'),
  deviceVerify: require('../../assets/images/device.png'),

  // ── Loans ────────────────────────────────────────────────────────────────
  loanCard: require('../../assets/images/pig.png'),
  loanStatusEmpty: require('../../assets/images/loan-status.png'),

  // ── Deposit ──────────────────────────────────────────────────────────────
  deposit: {
    bank: require('../../assets/images/deposit/Barnk.png'),
    card: require('../../assets/images/deposit/Card.png'),
    cards: require('../../assets/images/deposit/Cards.png'),
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  balanceCard: {
    available: require('../../assets/images/dashboard/ball.png'),
    savings: require('../../assets/images/dashboard/bag.png'),
    loan: require('../../assets/images/dashboard/barg.png'),
  },
  promo: require('../../assets/images/dashboard/New Notification.png'),
  recentEmpty: require('../../assets/images/dashboard/phone.png'),
};
