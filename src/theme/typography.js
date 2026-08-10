/**
 * NEAT design tokens — typography.
 *
 * The app currently loads NO custom font: `expo-font` is listed in
 * app.config.js plugins but `useFonts` was never called, so every weight
 * renders as the platform system font. This file is the seam that lets Stage 2
 * swap the typeface by editing THIS FILE ONLY — the ~480 `font-semibold` /
 * `fontWeight: '600'` call sites across the app never have to change.
 *
 * THE RULE THAT SHAPES EVERYTHING HERE:
 *
 *   Android does not synthesise font weights.
 *
 * `fontFamily: 'Inter'` + `fontWeight: '600'` renders as *regular* Inter on a
 * real Android device — silently, with no error, no warning. Each weight has to
 * be registered as its own family ('Inter-SemiBold'). So the token is a weight
 * NAME mapped to a (family, numeric weight) pair; never a numeric weight alone.
 *
 * Two consumers, one source of truth:
 *
 *   1. `fonts`       — tailwind.config.js reads this to build the
 *                      font-{normal,medium,semibold,bold,extrabold} utilities,
 *                      so `className="font-semibold"` picks up the family too.
 *   2. `weight`      — style objects spread these (`...weight.semibold`), since
 *                      the Tailwind plugin can't reach `style={{}}`.
 *   3. `fontAssets`  — src/theme/use-app-fonts.ts feeds this to expo-font.
 *
 * NOTE: this file is .js, not .ts, for the same reason as palette.js —
 * tailwind.config.js is CommonJS and has to `require()` it at build time. TS
 * files import it normally; types live in typography.d.ts.
 */

// ---------------------------------------------------------------------------
// Layer 1 — the typeface
// ---------------------------------------------------------------------------

/**
 * expo-font asset map, consumed by src/theme/use-app-fonts.ts.
 *
 * A FUNCTION, not a plain object, ON PURPOSE. tailwind.config.js `require()`s
 * this file in plain Node at build time, and Node cannot `require()` a .ttf —
 * it tries to parse the binary as JavaScript and throws, killing the build.
 * Wrapping the requires in a function means Node never evaluates them, while
 * Metro still resolves them statically (it collects `require(<string literal>)`
 * at any nesting depth). DO NOT inline this back into an object literal.
 *
 * Each key IS the fontFamily name React Native will know the font by, so the
 * keys here must match the values in `fonts` below exactly.
 */
const fontAssets = () => ({
  // ---- Stage 2 slot: drop the files in assets/fonts/, then uncomment. -----
  // 'Inter-Regular':  require('../../assets/fonts/Inter-Regular.ttf'),
  // 'Inter-Medium':   require('../../assets/fonts/Inter-Medium.ttf'),
  // 'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
  // 'Inter-Bold':     require('../../assets/fonts/Inter-Bold.ttf'),
  // ------------------------------------------------------------------------
});

/**
 * Weight name → registered family name.
 *
 * `undefined` means "no family" — React Native falls back to the system font
 * and honours `fontWeight` on its own, which is exactly today's behaviour.
 * Stage 2 replaces each value with a key from `fontAssets()` above.
 */
const fonts = {
  normal: undefined, // Stage 2: 'Inter-Regular'
  medium: undefined, // Stage 2: 'Inter-Medium'
  semibold: undefined, // Stage 2: 'Inter-SemiBold'
  bold: undefined, // Stage 2: 'Inter-Bold'
  // Only 2 call sites. If the family ships without an ExtraBold cut, point this
  // at the Bold file rather than leaving it to synthesise (it won't, on Android).
  extrabold: undefined, // Stage 2: 'Inter-ExtraBold'
};

// ---------------------------------------------------------------------------
// Layer 2 — style fragments (for `style={{}}` sites)
// ---------------------------------------------------------------------------

/**
 * SPREAD these, don't assign them:
 *
 *   { fontSize: 16, ...weight.semibold, color: colors.ink }
 *
 * The numeric `fontWeight` is kept alongside the family because iOS and web
 * still use it, and because it keeps the rendering identical while `fonts` is
 * all-undefined. React Native ignores `fontFamily: undefined`, so this is a
 * no-op until Stage 2 fills the map in.
 */
const weight = {
  normal: { fontFamily: fonts.normal, fontWeight: '400' },
  medium: { fontFamily: fonts.medium, fontWeight: '500' },
  semibold: { fontFamily: fonts.semibold, fontWeight: '600' },
  bold: { fontFamily: fonts.bold, fontWeight: '700' },
  extrabold: { fontFamily: fonts.extrabold, fontWeight: '800' },
};

module.exports = { fonts, fontAssets, weight };
