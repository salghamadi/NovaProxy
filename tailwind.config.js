/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        incy: {
          bg: '#0a0d0a',
          surface: '#111511',
          surface2: '#161b15',
          card: '#181e17',
          border: '#232c21',
          borderLight: '#32402f',
          green: '#a3e635', // Vibrant neon lime
          greenHover: '#bef264',
          greenDark: '#233215',
          greenPill: '#1c2612',
          textMuted: '#737a70',
          textSub: '#9da798',
          textLight: '#f4f5f4',
          accent: '#9be028'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 2s linear infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0.2' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
