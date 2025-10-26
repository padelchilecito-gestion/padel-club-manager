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

        'gray-dark': '#111827',
        'gray-medium': '#374151',
        'gray-light': '#4B5563',

        'green-dark': '#059669',
        'green-light': '#10B981',

        'indigo-dark': '#4F46E5',
        'indigo-light': '#6366F1',

        'yellow-dark': '#F59E0B',
        'yellow-light': '#FBBF24',
      },
    },
  },
  plugins: [],
}