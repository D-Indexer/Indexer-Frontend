/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Folder: verifiable portfolios on Stellar',
        short_name: 'Folder',
        description: 'Verifiable portfolios on Stellar. Previously verified portfolios stay readable offline.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell is precached; config.json is never precached so a new deployment's
        // runtime configuration is always fetched from the network.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/config.json'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ipfs\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Backend reads: network-first with a short TTL so data is fresh when online.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/folders') || url.pathname.startsWith('/portfolios') || url.pathname.startsWith('/templates'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'indexer-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Soroban RPC verification reads: network-first, short TTL.
            urlPattern: /^https:\/\/soroban-testnet\.stellar\.org\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'soroban-rpc',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // IPFS content is content-addressed, so it can be cached for a long time.
            urlPattern: /\/ipfs\/[^/]+/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ipfs-content',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Indexer-Backend listens on 3000 by default, so the dev server uses Vite's default port.
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    css: false,
    restoreMocks: true,
  },
})
