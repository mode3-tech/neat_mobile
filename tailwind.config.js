/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      spacing: {
        // Spacing scale: multiples of 4px (as defined in design system)
      },
    },
  },
  plugins: [],
};
