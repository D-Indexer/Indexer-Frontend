/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// The app version shown in the footer comes from package.json, which release-please bumps.
const { version } = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf8')) as { version: string }

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
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
