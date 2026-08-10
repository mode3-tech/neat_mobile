const { tailwindColors } = require('./src/theme/palette');

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
  plugins: [],
};
