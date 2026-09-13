/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#faf5ed',
          200: '#f5ead5',
          300: '#eedab8',
          400: '#e4c596',
          500: '#dab075',
        },
        brown: {
          50: '#faf6f2',
          100: '#f0e4d7',
          200: '#e0c9b3',
          300: '#cda884',
          400: '#b8895f',
          500: '#a06d44',
          600: '#8b5a3c',
          700: '#6f4530',
          800: '#5a3727',
          900: '#482c20',
          950: '#2a1810',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(72, 44, 32, 0.06), 0 1px 2px rgba(72, 44, 32, 0.04)',
        'card-hover': '0 4px 12px rgba(72, 44, 32, 0.08), 0 2px 4px rgba(72, 44, 32, 0.04)',
        'soft': '0 2px 8px rgba(72, 44, 32, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
