/**
 * Verify responsive admin nav at 375px viewport
 */
import { chromium } from '@playwright/test'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3001'
const OUT = join(__dir, 'screenshots-tour')

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('input[name="email"]', 'jordicom78@gmail.com')
  await page.fill('input[name="password"]', 'Hmb@2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL(`**/admin`, { timeout: 15000 })
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // ── DESKTOP (1280px) ──
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const dPage = await desktop.newPage()
  await login(dPage)
  await dPage.screenshot({ path: join(OUT, 'nav-desktop.png') })
  console.log('✓ nav-desktop.png')

  // Hamburger should NOT be visible at desktop
  const hamburgerAtDesktop = await dPage.locator('button[aria-label="Abrir menú"]').isVisible()
  // Desktop links should be visible (check "Reservas" link)
  const desktopLinksVisible = await dPage.locator('nav a').filter({ hasText: 'Reservas' }).first().isVisible()
  console.log('  desktop: hamburger visible (should be false):', hamburgerAtDesktop)
  console.log('  desktop: nav links visible (should be true):', desktopLinksVisible)
  await desktop.close()

  // ── MOBILE (375px) ──
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const mPage = await mobile.newPage()
  await login(mPage)

  await mPage.screenshot({ path: join(OUT, 'nav-mobile-closed.png') })
  console.log('✓ nav-mobile-closed.png')

  const hamburgerAtMobile = await mPage.locator('button[aria-label="Abrir menú"]').isVisible()
  console.log('  mobile: hamburger visible (should be true):', hamburgerAtMobile)

  // open mobile menu
  await mPage.click('button[aria-label="Abrir menú"]')
  await mPage.waitForTimeout(300)
  await mPage.screenshot({ path: join(OUT, 'nav-mobile-open.png') })
  console.log('✓ nav-mobile-open.png')

  // verify all items in dropdown
  const expected = ['Dashboard', 'Reservas', 'Calendario', 'Registros', 'Contenido', 'Configuración', 'Salir']
  for (const label of expected) {
    const vis = await mPage.getByText(label).first().isVisible().catch(() => false)
    console.log(`  "${label}" visible: ${vis}`)
  }

  // click link → menu closes
  await mPage.getByText('Reservas').first().click()
  await mPage.waitForTimeout(400)
  const hamburgerAfterNav = await mPage.locator('button[aria-label="Abrir menú"]').isVisible().catch(() => false)
  console.log('  hamburger still visible after nav (menu closed):', hamburgerAfterNav)
  await mPage.screenshot({ path: join(OUT, 'nav-mobile-after-nav.png') })
  console.log('✓ nav-mobile-after-nav.png')

  await mobile.close()
  await browser.close()
})()
