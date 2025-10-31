/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tus colores personalizados ahora serán manejados por DaisyUI
      // pero los dejamos aquí por si los usas en clases que no son de DaisyUI
      colors: {
        'primary': '#00F0FF',
        'secondary': '#00F0FF',
        'accent': '#FF00C7',
        'danger': '#FF4136',
        'dark-primary': '#0D1117',
        'dark-secondary': '#161B22',
        'text-primary': '#E6EDF3',
        'text-secondary': '#7D8590',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    // Forzamos solo tu tema oscuro personalizado
    themes: [
      {
        dark: {
          "primary": "#00F0FF",       // Tu 'primary'
          "secondary": "#00F0FF",     // Tu 'secondary'
          "accent": "#FF00C7",       // Tu 'accent'
          "neutral": "#161B22",      // Tu 'dark-secondary'
          "base-100": "#0D1117",     // Tu 'dark-primary' (fondo principal)
          "base-200": "#161B22",     // Tu 'dark-secondary' (fondo de tarjetas/inputs)
          "base-300": "#21262d",     // Un gris un poco más claro
          "base-content": "#E6EDF3",  // Tu 'text-primary' (texto principal)
          
          "info": "#00F0FF",         // Usamos tu primario
          "success": "#36D399",     // Un verde estándar
          "warning": "#FBBD23",     // Un amarillo estándar
          "error": "#FF4136",       // Tu 'danger'
        },
      },
    ],
    darkTheme: "dark", // Asegura que "dark" sea el tema por defecto
    base: true,
    styled: true,
    utils: true,
  },
}
