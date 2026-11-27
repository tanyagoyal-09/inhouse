/**
 * Design tokens for the SRMS-branded Inhouse Patent Filing System interface.
 *
 * Brand colour: the deep crimson used in the official SRMS / SRMS CET logo
 * (sampled from the logo assets bundled with this project, #9B0102 – #A32B23).
 * `brand-600` is the primary action colour; it passes WCAG AA (≈8:1) against white.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#A01C21',
          50: '#FDF3F3',
          100: '#FAE3E4',
          200: '#F3C5C7',
          300: '#E79A9D',
          400: '#D55E63',
          500: '#BC2E34',
          600: '#A01C21',
          700: '#84151A',
          800: '#6A1115',
          900: '#4E0C0F',
        },
        charcoal: '#22262B',
        paper: '#F8F6F3',
        line: '#E6E0D9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(34,38,43,.06), 0 6px 18px rgba(34,38,43,.05)',
      },
    },
  },
  plugins: [],
};
