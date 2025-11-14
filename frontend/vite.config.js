import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Padel Club Manager',
        short_name: 'PadelClub',
        description: 'App para la gestión de un club de pádel',
        theme_color: '#0D1B2A',
        background_color: '#0D1B2A',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            // --- CORRECCIÓN DE NOMBRE DE ARCHIVO ---
            src: 'web-app-manifest-192x192.png', // Antes decía 'pwa-192x192.png'
            sizes: '192x192',
            type: 'image/png',
          },
          {
            // --- CORRECCIÓN DE NOMBRE DE ARCHIVO ---
            src: 'web-app-manifest-512x512.png', // Antes decía 'pwa-512x512.png'
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // --- CORRECCIÓN DE NOMBRE DE ARCHIVO ---
            src: 'web-app-manifest-512x512.png', // Antes decía 'pwa-512x512.png'
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
