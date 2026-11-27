import { defineConfig, devices } from '@playwright/test'

/**
 * Visual regression suite (issue #234). Runs the app in demo mode so every screen renders from
 * bundled fixtures with no backend, contract or wallet. Baselines live in `e2e/__screenshots__/`
 * and are compared pixel-for-pixel; a diff fails the run and the diff images are uploaded by CI.
 *
 * Reproducibility: one browser (Chromium), one device scale factor, fixed viewport sizes, the
 * bundled fonts only, and `animations: 'disabled'` in the assertions. Regenerate baselines with
 * `npm run test:visual:update` on the same Playwright version pinned in package.json.
 */
const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0,
      scale: 'css',
      threshold: 0,
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    colorScheme: 'light',
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: false } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_DEMO_MODE: 'true',
      VITE_API_URL: '',
      VITE_FOLDER_CONTRACT_ID: '',
    },
  },
})
