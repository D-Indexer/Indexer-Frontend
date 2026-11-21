/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import path from 'path'

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
  plugins: [react()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
    __BUILD_SOURCE_DATE_EPOCH__: JSON.stringify(sourceDateEpoch),
  },
  build: {
    // Deterministic asset names: no content hash, no per-build salt.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
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
    define: {
      __BUILD_COMMIT__: JSON.stringify('test-commit'),
    },
  },
})
