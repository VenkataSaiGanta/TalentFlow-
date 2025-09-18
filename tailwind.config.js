/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 6px 24px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          600: '#0f172a',
          500: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
