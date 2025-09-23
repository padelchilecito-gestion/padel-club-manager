import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      /* ... tu configuración de PWA ... */
    })
  ],
  // --- CAMBIO CLAVE: Añadir configuración del servidor proxy ---
  server: {
    proxy: {
      // Redirige las peticiones de /api al backend en localhost:5001
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    }
  }
})
