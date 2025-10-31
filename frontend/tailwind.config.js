/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#3B82F6", // Este es el color principal (azul)
          
          "secondary": "#F000B8",
          "accent": "#37CDBE",
          "neutral": "#3D4451",

          // ---
          // --- CAMBIO REALIZADO AQUÍ ---
          // ---
          // Cambiamos 'base-100' (fondo de la página) de blanco a gris-200
          // para que coincida con el layout del Admin.
          "base-100": "#E5E7EB", // Antes era "#FFFFFF"
          // ---
          // ---
          
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",

          // Añadimos 'base-content' para asegurar que el texto siga siendo oscuro
          "base-content": "#1f2937",
        },
      },
      "dark", 
    ],
  },
}
