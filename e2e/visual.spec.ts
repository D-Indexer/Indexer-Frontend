import { expect, test, type Page } from '@playwright/test'

/**
 * Screenshot baselines for the key screens and states, in demo mode, at desktop and 375px widths.
 * Each test waits for the settled state (spinner gone, content visible) before capturing so the
 * images do not depend on timing.
 */

const DEMO_FOLDER = 'demo.folder'

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.loading-state')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}

const capture = async (page: Page, name: string) => {
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
}

test.describe('key screens', () => {
  test('home', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /Build a portfolio people can verify/ })).toBeVisible()
    await capture(page, 'home')
  })

  test('templates', async ({ page }) => {
    await page.goto('/templates')
    await expect(page.getByRole('heading', { level: 1, name: 'Portfolio templates' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(3)
    await capture(page, 'templates')
  })

  test('dashboard (demo mode blocks on-chain actions)', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('status').filter({ hasText: 'Demo mode is on' })).toBeVisible()
    await capture(page, 'dashboard-demo')
  })

  test('public portfolio: demo verification', async ({ page }) => {
    await page.goto(`/p/${DEMO_FOLDER}`)
    await expect(page.getByRole('complementary', { name: 'Verification' })).toContainText('Demo data, not verified')
    await capture(page, 'public-portfolio-demo')
  })

  test('public portfolio: not found (empty state)', async ({ page }) => {
    await page.goto('/p/nobody-here.folder')
    await expect(page.getByRole('region', { name: 'Folder not found' })).toBeVisible()
    await capture(page, 'public-portfolio-empty')
  })
})

test.describe('portfolio templates', () => {
  for (const [templateId, name] of [
    [1, 'developer'],
    [2, 'designer'],
    [3, 'operations'],
  ] as const) {
    test(`template ${templateId} (${name})`, async ({ page }) => {
      await page.goto(`/p/${DEMO_FOLDER}?template=${templateId}`)
      await expect(page.locator(`.portfolio--${name}`)).toBeVisible()
      await capture(page, `template-${templateId}-${name}`)
    })
  }
})

test.describe('loading and error states', () => {
  test('templates: loading', async ({ page }) => {
    await page.route('**/templates', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      await route.abort()
    })
    await page.goto('/templates')
    await expect(page.getByRole('status').filter({ hasText: 'Loading templates…' })).toBeVisible()
    await expect(page).toHaveScreenshot('templates-loading.png', { fullPage: true })
  })

  test('templates: error with retry', async ({ page }) => {
    await page.route('**/templates', (route) => route.abort())
    await page.goto('/templates')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
    await capture(page, 'templates-error')
  })
})
