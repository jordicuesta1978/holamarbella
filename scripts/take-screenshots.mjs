/**
 * Screenshot tour — HolaMarbella production
 * Usage: node scripts/take-screenshots.mjs
 */

import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, 'screenshots-tour')
mkdirSync(OUT, { recursive: true })

// Public pages use production; admin pages use local server (env vars known)
const BASE_PUBLIC = 'https://holamarbella.vercel.app'
const BASE_ADMIN  = 'http://localhost:3001'
const BASE = BASE_PUBLIC  // default for helpers
const ADMIN_EMAIL = 'jordicom78@gmail.com'
const ADMIN_PASSWORD = 'changeme'

const W = 1280

async function shot(page, name, opts = {}) {
  const file = join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? true })
  console.log(`  ✓ ${name}.png`)
}

async function scrollTo(page, selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded().catch(() => {})
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: W, height: 900 } })
  const page = await ctx.newPage()

  // ── Páginas públicas ────────────────────────────────────────────────────────
  console.log('\n📸 Páginas públicas')

  await page.goto(`${BASE}/es`, { waitUntil: 'networkidle' })
  await shot(page, '01-home')

  await page.goto(`${BASE}/es/apartamentos`, { waitUntil: 'networkidle' })
  await shot(page, '02-apartamentos-listado')

  await page.goto(`${BASE}/es/apartamentos/paloma`, { waitUntil: 'networkidle' })
  await shot(page, '03-apartamento-paloma-top')
  // scroll to calendar
  await scrollTo(page, '[data-testid="calendar"], .calendar, input[type="date"], button:has-text("Solicitar")')
  await page.waitForTimeout(600)
  await shot(page, '04-apartamento-paloma-calendario', { fullPage: false })

  await page.goto(`${BASE}/es/reservar/paloma`, { waitUntil: 'networkidle' })
  await shot(page, '05-reservar-paloma')

  await page.goto(`${BASE}/es/informacion`, { waitUntil: 'networkidle' })
  await shot(page, '06-informacion-blog')

  await page.goto(`${BASE}/es/normas`, { waitUntil: 'networkidle' })
  await shot(page, '07-normas-casa')

  await page.goto(`${BASE}/es/registro-viajeros`, { waitUntil: 'networkidle' })
  await shot(page, '08-registro-viajeros')

  // ── Admin — login via local server ─────────────────────────────────────────
  console.log('\n📸 Páginas admin (servidor local)')

  await page.goto(`${BASE_ADMIN}/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', ADMIN_EMAIL)
  await page.fill('input[name="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await Promise.race([
    page.waitForURL(`${BASE_ADMIN}/admin`, { timeout: 20000 }),
    page.waitForSelector('p[style*="e53e3e"]', { timeout: 20000 }),
  ]).catch(() => {})
  await page.waitForTimeout(1000)

  const currentUrl = page.url()
  if (!currentUrl.includes('/admin') || currentUrl.includes('/admin/login')) {
    const errorText = await page.locator('p').filter({ hasText: 'incorrectas' }).textContent().catch(() => '')
    console.error(`  ✗ Login fallido. URL: ${currentUrl}. Error: ${errorText}`)
    await shot(page, '09-admin-login-error', { fullPage: false })
    await browser.close()
    process.exit(1)
  }
  await shot(page, '09-admin-dashboard')

  await page.goto(`${BASE_ADMIN}/admin/reservas`, { waitUntil: 'networkidle' })
  await shot(page, '10-admin-reservas')

  await page.goto(`${BASE_ADMIN}/admin/contenido`, { waitUntil: 'networkidle' })
  await shot(page, '11-admin-contenido')

  await page.goto(`${BASE_ADMIN}/admin/contenido/disponibilidad`, { waitUntil: 'networkidle' })
  await shot(page, '12-admin-contenido-disponibilidad')

  await page.goto(`${BASE_ADMIN}/admin/contenido/precios`, { waitUntil: 'networkidle' })
  await shot(page, '13-admin-contenido-precios')

  await browser.close()
  console.log(`\n✅ Screenshots guardados en: scripts/screenshots-tour/\n`)
})()
