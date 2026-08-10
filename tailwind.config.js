const plugin = require('tailwindcss/plugin');

const { tailwindColors } = require('./src/theme/palette');
const { fonts } = require('./src/theme/typography');

/**
 * Redefines font-{normal,medium,semibold,bold,extrabold} to emit a fontFamily
 * alongside the fontWeight.
 *
 * Android does not synthesise font weights, so `fontFamily: 'Inter'` +
 * `fontWeight: '600'` renders as regular Inter on a real device. Each weight
 * must carry its own registered family — see src/theme/typography.js.
 *
 * While every `fonts[name]` is undefined (Stage 1) this emits EXACTLY what
 * Tailwind's core fontWeight plugin emits today — `.font-semibold {
 * font-weight: 600 }`, one declaration — so it is a byte-identical no-op.
 * Stage 2 fills the map in typography.js and every `font-*` class in the app
 * picks up the new typeface without a single screen being touched.
 *
 * Driven off `theme('fontWeight')` (all nine default names) rather than the
 * five in `fonts`, so font-light / font-black keep behaving exactly as before
 * if anyone reaches for one.
 */
const fontWeightUtilities = plugin(({ addUtilities, theme }) => {
  const utilities = {};
  for (const [name, value] of Object.entries(theme('fontWeight'))) {
    const family = fonts[name];
    utilities[`.font-${name}`] = family
      ? { 'font-family': family, 'font-weight': value }
      : { 'font-weight': value };
  }
  addUtilities(utilities);
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Semantic colour tokens. Source of truth: src/theme/palette.js
      // Gives us bg-primary, text-text-secondary, border-line, bg-danger-surface, …
      colors: tailwindColors,
      spacing: {
        // Spacing scale: multiples of 4px (as defined in design system)
      },
    },
  },
  corePlugins: {
    // Turned off so fontWeightUtilities below is the ONLY source of .font-*
    // rules — no duplicate declarations, and no relying on plugin ordering to
    // decide which one wins. The plugin re-implements the full default scale.
    fontWeight: false,
  },
  plugins: [fontWeightUtilities],
};
