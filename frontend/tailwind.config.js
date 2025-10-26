/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#0D1B2A',
        'dark-secondary': '#1B263B',
        'primary': '#FF6700',
        'primary-dark': '#E05D00',
        'secondary': '#00C9A7',
        'text-primary': '#E0E1DD',
        'text-secondary': '#778DA9',
        'danger': '#D90429',
      },
    },
  },
  plugins: [],
}