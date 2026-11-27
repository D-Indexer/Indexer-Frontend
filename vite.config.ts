/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import path from 'path'
import { readFileSync } from 'fs'

// The app version shown in the footer comes from package.json, which release-please bumps.
const { version } = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf8')) as { version: string }

/**
 * Reproducible builds (issue #243).
 *
 * `SOURCE_DATE_EPOCH` pins every timestamp Vite/rollup can emit, and the commit
 * is read from git (or `BUILD_COMMIT` in CI) so two builds of the same commit
 * are byte-identical. See docs/build-provenance.md.
 */
const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH || '0'

const readCommit = () => {
  if (process.env.BUILD_COMMIT) return process.env.BUILD_COMMIT.trim()
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const buildCommit = readCommit()

export default defineConfig({
  // Relative asset paths so the bundle works from any gateway path (`/ipfs/<cid>/`).
  base: './',
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/testing/**',
        'src/data/fixtures/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        'src/services/**': {
          lines: 90,
          branches: 90,
        },
        'src/features/**': {
          lines: 70,
          branches: 70,
        },
      },
    },
  },
})
