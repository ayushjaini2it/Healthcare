/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        medical: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.animate-delay-100': { 'animation-delay': '100ms', 'animation-fill-mode': 'both' },
        '.animate-delay-200': { 'animation-delay': '200ms', 'animation-fill-mode': 'both' },
        '.animate-delay-300': { 'animation-delay': '300ms', 'animation-fill-mode': 'both' },
        '.animate-delay-400': { 'animation-delay': '400ms', 'animation-fill-mode': 'both' },
        '.animate-delay-500': { 'animation-delay': '500ms', 'animation-fill-mode': 'both' },
        '.animate-delay-700': { 'animation-delay': '700ms', 'animation-fill-mode': 'both' },
        '.animate-delay-900': { 'animation-delay': '900ms', 'animation-fill-mode': 'both' },
        '.animate-fill-both': { 'animation-fill-mode': 'both' },
      }
      addUtilities(newUtilities)
    }
  ],
}
