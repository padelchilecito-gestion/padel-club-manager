/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Inter"', 'sans-serif'],
        'title': ['"Exo 2"', 'sans-serif'],
      },
      colors: {
        'dark-primary': '#0D1B2A',      // Azul noche (fondo principal)
        'dark-secondary': '#1B263B',    // Azul acero (tarjetas, secciones)
        'primary': '#FF6700',         // Naranja vibrante (acento principal)
        'primary-dark': '#E05D00',      // Naranja más oscuro (hover)
        'secondary': '#00C9A7',       // Cian (éxito, bordes)
        'text-primary': '#E0E1DD',      // Blanco cálido (texto principal)
        'text-secondary': '#778DA9',    // Gris azulado (texto secundario)
        'danger': '#D90429',          // Rojo para errores/alertas
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(255, 103, 0, 0.3)',
        'primary-hover': '0 6px 20px 0 rgba(255, 103, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'lift': 'lift 0.3s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}