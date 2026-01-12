import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true, // Allow all hosts for tunnel testing
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'Resilink',
        short_name: 'Resilink',
        description: 'Magic Link for Dropshippers and Suppliers',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/upload',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'file',
                accept: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']
              }
            ]
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Handle the share target POST request
        runtimeCaching: [
          {
            urlPattern: /\/upload$/,
            method: 'POST',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'share-target-queue'
              }
            }
          }
        ]
      }
    })
  ],
})
