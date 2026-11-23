/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
    env: {
      VITE_API_URL: 'http://indexer.test',
      VITE_FOLDER_CONTRACT_ID: 'CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV',
    },
  },
})
