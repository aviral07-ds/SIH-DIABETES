/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retina: {
          navy: '#0A192F',
          dark: '#0F172A',
          slate: '#1E293B',
          brand: '#0369A1',
          cyan: '#0284C7',
          lightCyan: '#E0F2FE',
          teal: '#0D9488',
          accent: '#0D9488',
          bgLight: '#F8FAFC',
          cardBg: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
