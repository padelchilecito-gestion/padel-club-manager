import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// --- 1. AÑADIR ESTA LÍNEA ---
import { version } from './package.json' 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // --- 2. ESTE ES TU BLOQUE PWA COMPLETO (¡CORRECTO!) ---
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'icon-512.svg'],
      manifest: {
        name: 'Padel Club Manager',
        short_name: 'PadelApp',
        description: 'App de gestión de Padel Club',
        theme_color: '#1e3a8a', // Azul oscuro
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  
  // --- 3. AÑADIR ESTE BLOQUE PARA LA VERSIÓN ---
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version)
  }
})
