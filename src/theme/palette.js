/**
 * NEAT design tokens — colour.
 *
 * This is the single source of truth for every colour in the app. Screens must
 * never contain a hardcoded hex; they reference a SEMANTIC name from `colors`
 * (or a Tailwind utility built from it), so the whole app can be re-skinned by
 * editing this one file.
 *
 * Three layers, in order:
 *
 *   1. `raw`             — the literal hexes. Named by appearance (brand.500).
 *                          Every hex in the app appears exactly once, here.
 *   2. `colors`          — semantic names. Named by JOB (inkSoft, danger).
 *                          This is what TS files import.
 *   3. `tailwindColors`  — the same semantic names, shaped for tailwind.config.js.
 *
 * Screens use layer 2 and 3 only. Never reference `raw` outside this file — a
 * screen that says `gray500` breaks when the new design makes secondary text
 * navy instead of grey.
 *
 * NOTE: this file is .js, not .ts, because tailwind.config.js is CommonJS and
 * has to `require()` it at build time. TS files can import it normally.
 */

// ---------------------------------------------------------------------------
// Layer 1 — raw scale
// ---------------------------------------------------------------------------

const raw = {
  brand: {
    50: '#EEF0FF', // tinted card / info surface
    100: '#D4D8FF',
    200: '#D9DCF4',
    500: '#472FF8', // NEAT primary
    900: '#2A1B6A',
    950: '#0D0B2E',
  },

  // Mostly Tailwind's default grey scale, which the app already follows.
  gray: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    150: '#F5F5F5', // input background (not a Tailwind default)
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#374151',
    900: '#1A1A1A',
    1000: '#000000',
  },

  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    500: '#EF4444',
    600: '#DC2626',
  },

  green: {
    50: '#ECFDF5',
    75: '#F0FDF4',
    100: '#D1FAE5',
    500: '#22C55E',
    600: '#16A34A',
  },

  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#E59501',
    700: '#B45309',
  },

  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    500: '#F97316',
  },

  // Accent hues used only by transaction-category chips and the confetti burst.
  blue: { 50: '#EBF5FF', 500: '#3B82F6' },
  purple: { 50: '#F3E8FF', 75: '#F3F0FF', 100: '#E9D5FF', 500: '#7C3AED' },
  pink: { 50: '#FDF2F8', 75: '#FFF1F2', 500: '#EC4899' },
  teal: { 500: '#10B981', 600: '#00BFA6' },
  cyan: { 500: '#06B6D4' },

  /**
   * Near-duplicates of tokens above, kept ONLY so token extraction stays a
   * pixel-for-pixel no-op. Each is 1–2 call sites that drifted from the scale.
   * Collapsing them is a real (if tiny) visual change, so it belongs in Stage 2,
   * not here. See `legacy` in `colors` below.
   */
  drift: {
    ink1: '#161617',
    ink2: '#272626',
    ink3: '#29292A',
    ink4: '#2C2D2D',
    faint: '#B0B0C0',
    surface1: '#F6F5F8',
    surface2: '#F3F3F4',
    surface3: '#EFEFEF',
    surface4: '#ECECEC',
    warnSurface: '#FEF3E2',
  },
};

// ---------------------------------------------------------------------------
// Layer 2 — semantic tokens (import these from TS)
// ---------------------------------------------------------------------------

const colors = {
  // --- brand -------------------------------------------------------------
  primary: raw.brand[500], // 262 uses — buttons, active states, links, icons
  primaryDark: raw.brand[900],
  primaryDeep: raw.brand[950],
  /** Tinted card behind info/success copy. */
  primarySurface: raw.brand[50], // 45 uses
  primarySurfaceStrong: raw.brand[100],
  primaryBorder: raw.brand[200],

  // --- text ("ink") ------------------------------------------------------
  /** Headings and primary body copy. */
  ink: raw.gray[900], // 253 uses
  /** Slightly lighter body copy / secondary buttons. */
  inkBody: raw.gray[700], // 112 uses
  /** Labels, captions, helper text. */
  inkSoft: raw.gray[500], // 123 uses
  /** Placeholders, disabled text, inactive icons. */
  inkMuted: raw.gray[400], // 144 uses
  /** Text on primary/dark backgrounds. */
  inkInverse: raw.gray[0],

  // --- surfaces ----------------------------------------------------------
  /** Default screen background. */
  surface: raw.gray[0],
  surfaceMuted: raw.gray[50],
  surfaceSubtle: raw.gray[100],
  /** Text-input background. */
  surfaceInput: raw.gray[150], // 69 uses
  /** Disabled button background. Same hex as `line` today — Stage 2 may split. */
  surfaceDisabled: raw.gray[200],

  // --- lines -------------------------------------------------------------
  /** Default border / divider. */
  line: raw.gray[200], // 122 uses (shared with surfaceDisabled)
  lineSubtle: raw.gray[100],
  lineStrong: raw.gray[300],

  // --- status ------------------------------------------------------------
  success: raw.green[600], // 27 uses
  successBright: raw.green[500],
  successSurface: raw.green[50],
  successSurfaceAlt: raw.green[75],
  successSurfaceStrong: raw.green[100],

  danger: raw.red[500], // 69 uses
  dangerStrong: raw.red[600],
  dangerSurface: raw.red[50],
  dangerSurfaceStrong: raw.red[100],
  dangerBorder: raw.red[200],

  warning: raw.amber[500], // 11 uses
  warningStrong: raw.amber[700],
  warningAccent: raw.amber[600],
  warningSurface: raw.amber[50],
  warningSurfaceStrong: raw.amber[100],
  warningSurfaceAlt: raw.orange[50],
  warningBorder: raw.orange[200],
  warningBorderStrong: raw.orange[100],

  // --- misc --------------------------------------------------------------
  /** Modal/sheet scrim. Always used with an opacity. */
  overlay: raw.gray[1000],
  /** Active-loan card CTA. The one place the app uses a mint accent. */
  accentMint: raw.teal[600],

  /**
   * See `raw.drift`. These exist purely to keep extraction visually identical.
   * Do NOT reach for them in new code — pick the real token above.
   */
  legacy: {
    text1: raw.drift.ink1,
    text2: raw.drift.ink2,
    text3: raw.drift.ink3,
    text4: raw.drift.ink4,
    textFaint: raw.drift.faint,
    surface1: raw.drift.surface1,
    surface2: raw.drift.surface2,
    surface3: raw.drift.surface3,
    surface4: raw.drift.surface4,
    warningSurface: raw.drift.warnSurface,
  },
};

/**
 * Transaction-category chips (icon + tinted background) and the success
 * confetti burst. Decorative accents — deliberately kept out of the semantic
 * set above so the new design can restyle them independently.
 */
const accents = {
  airtime: { surface: raw.purple[75], icon: colors.primary },
  transfer: { surface: raw.blue[50], icon: raw.blue[500] },
  data: { surface: raw.green[50], icon: raw.teal[500] },
  electricity: { surface: raw.orange[50], icon: colors.warning },
  cable: { surface: raw.pink[75], icon: raw.orange[500] },
  betting: { surface: raw.red[50], icon: colors.danger },
  reward: { surface: raw.pink[50], icon: raw.pink[500] },
  loan: { surface: raw.purple[50], icon: raw.purple[500] },
  loanAlt: { surface: raw.purple[100], icon: raw.purple[500] },
  fallback: { surface: raw.gray[100], icon: colors.inkSoft },
};

/** Confetti colours for the success celebration. */
const confetti = [
  colors.primary,
  colors.success,
  colors.warning,
  colors.danger,
  raw.cyan[500],
  raw.pink[500],
];

// ---------------------------------------------------------------------------
// Layer 3 — Tailwind shape
// ---------------------------------------------------------------------------

/**
 * Nested so utilities read naturally:
 *   bg-primary          text-ink        border-line
 *   bg-primary-surface  text-ink-soft   border-line-subtle
 *   bg-surface-input    text-ink-muted  bg-danger-surface
 */
const tailwindColors = {
  primary: {
    DEFAULT: colors.primary,
    dark: colors.primaryDark,
    deep: colors.primaryDeep,
    surface: colors.primarySurface,
    'surface-strong': colors.primarySurfaceStrong,
    border: colors.primaryBorder,
  },
  ink: {
    DEFAULT: colors.ink,
    body: colors.inkBody,
    soft: colors.inkSoft,
    muted: colors.inkMuted,
    inverse: colors.inkInverse,
  },
  surface: {
    DEFAULT: colors.surface,
    muted: colors.surfaceMuted,
    subtle: colors.surfaceSubtle,
    input: colors.surfaceInput,
    disabled: colors.surfaceDisabled,
  },
  line: {
    DEFAULT: colors.line,
    subtle: colors.lineSubtle,
    strong: colors.lineStrong,
  },
  success: {
    DEFAULT: colors.success,
    bright: colors.successBright,
    surface: colors.successSurface,
    'surface-alt': colors.successSurfaceAlt,
    'surface-strong': colors.successSurfaceStrong,
  },
  danger: {
    DEFAULT: colors.danger,
    strong: colors.dangerStrong,
    surface: colors.dangerSurface,
    'surface-strong': colors.dangerSurfaceStrong,
    border: colors.dangerBorder,
  },
  warning: {
    DEFAULT: colors.warning,
    strong: colors.warningStrong,
    accent: colors.warningAccent,
    surface: colors.warningSurface,
    'surface-strong': colors.warningSurfaceStrong,
    'surface-alt': colors.warningSurfaceAlt,
    border: colors.warningBorder,
    'border-strong': colors.warningBorderStrong,
  },
  overlay: colors.overlay,
  'accent-mint': colors.accentMint,

  // Decorative category accents — see `accents`. Exposed here so className
  // sites can use them (bg-accent-loan) instead of falling back to a raw hex.
  accent: {
    airtime: accents.airtime.surface,
    transfer: accents.transfer.surface,
    data: accents.data.surface,
    electricity: accents.electricity.surface,
    cable: accents.cable.surface,
    betting: accents.betting.surface,
    reward: accents.reward.surface,
    loan: accents.loan.surface,
    'loan-strong': accents.loanAlt.surface,
    fallback: accents.fallback.surface,
  },

  // Drift tokens — see `colors.legacy`. Remove once Stage 2 consolidates them.
  legacy: {
    'text-1': colors.legacy.text1,
    'text-2': colors.legacy.text2,
    'text-3': colors.legacy.text3,
    'text-4': colors.legacy.text4,
    'text-faint': colors.legacy.textFaint,
    'surface-1': colors.legacy.surface1,
    'surface-2': colors.legacy.surface2,
    'surface-3': colors.legacy.surface3,
    'surface-4': colors.legacy.surface4,
    'warning-surface': colors.legacy.warningSurface,
  },
};

module.exports = { raw, colors, accents, confetti, tailwindColors };
