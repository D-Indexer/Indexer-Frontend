/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    // Hidden source maps are uploaded to the error reporter at release and are
    // not referenced from the shipped bundles.
    sourcemap: 'hidden',
  },
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
