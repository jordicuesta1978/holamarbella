/**
 * Captures the tour popup to verify header contrast
 */
import { chromium } from '@playwright/test'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3001'

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // Fresh context with no cache, cleared on each run
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    // No cache
  })

  const page = await ctx.newPage()

  // Capture network failures
  const failures = []
  page.on('requestfailed', req => failures.push(`FAIL — ${req.url()}`))
  page.on('response', resp => {
    if (resp.status() >= 400) failures.push(`${resp.status()} — ${resp.url()}`)
  })

  // Login
  console.log('1. Logging in...')
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL)
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`**/admin`, { timeout: 15000 })
  await page.waitForTimeout(3500) // let client JS hydrate + tour timer

  console.log('2. Clearing tour flag...')
  await page.evaluate(() => localStorage.removeItem('hmb_tour_done'))

  console.log('3. Navigating to /admin fresh (no reload, new navigation)...')
  failures.length = 0
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500) // 700ms tour timer + shepherd import

  console.log('Network failures:')
  failures.forEach(f => console.log(' ', f))

  const tourVisible = await page.locator('.shepherd-element').isVisible().catch(() => false)
  console.log('Tour visible:', tourVisible)
  const shepherdCount = await page.locator('[class*="shepherd"]').count()
  console.log('Shepherd elements:', shepherdCount)

  const debug = join(__dir, 'screenshots-tour', 'debug-after-reload.png')
  await page.screenshot({ path: debug })
  console.log('Screenshot:', debug)

  if (tourVisible) {
    const styles = await page.evaluate(() => {
      const header = document.querySelector('.shepherd-has-title .shepherd-content .shepherd-header')
      const title  = document.querySelector('.shepherd-title')
      if (!header || !title) return { error: 'not found' }
      return {
        headerBg: getComputedStyle(header).backgroundColor,
        titleColor: getComputedStyle(title).color,
        titleText: title.textContent?.trim(),
      }
    })
    console.log('Styles:', JSON.stringify(styles, null, 2))

    const out1 = join(__dir, 'screenshots-tour', 'tour-step1-contrast.png')
    await page.screenshot({ path: out1 })
    console.log('✓ Saved tour-step1-contrast.png')
  }

  await browser.close()
})()
