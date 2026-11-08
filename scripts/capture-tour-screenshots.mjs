import { chromium } from 'playwright'
import { existsSync, mkdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'screenshots-tour')
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const BASE = 'https://holamarbella.vercel.app'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

const W = 1280
const H_VIEWPORT = 800

const results = []

function log(name, ok, size, note = '') {
  results.push({ name, ok, size, note })
  console.log(`${ok ? '✅' : '❌'} ${name}${size ? ` (${size})` : ''}${note ? ' — ' + note : ''}`)
}

function fileSize(p) {
  try {
    const bytes = statSync(p).size
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`
  } catch { return '?' }
}

async function shot(page, filename, { fullPage = false, clip = null } = {}) {
  const p = join(OUT_DIR, filename)
  const opts = { path: p, type: 'png' }
  if (clip) opts.clip = clip
  else opts.fullPage = fullPage
  await page.screenshot(opts)
  return p
}

async function waitReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1200)
}

const browser = await chromium.launch({ headless: true })

// ─── PUBLIC PAGES ────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H_VIEWPORT } })
  const page = await ctx.newPage()

  // 1. home-hero.png — /es, solo viewport sin scroll
  try {
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'home-hero.png', { clip: { x: 0, y: 0, width: W, height: H_VIEWPORT } })
    log('home-hero.png', true, fileSize(p))
  } catch (e) { log('home-hero.png', false, null, e.message) }

  // 2. apartamentos.png — /es/apartamentos, full page
  try {
    await page.goto(`${BASE}/es/apartamentos`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'apartamentos.png', { fullPage: true })
    log('apartamentos.png', true, fileSize(p))
  } catch (e) { log('apartamentos.png', false, null, e.message) }

  // 3. apartamento-detalle.png — /es/apartamentos/paloma, top viewport
  try {
    await page.goto(`${BASE}/es/apartamentos/paloma`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'apartamento-detalle.png', { clip: { x: 0, y: 0, width: W, height: H_VIEWPORT } })
    log('apartamento-detalle.png', true, fileSize(p))
  } catch (e) { log('apartamento-detalle.png', false, null, e.message) }

  // 4. apartamento-calendario.png — scroll hasta el calendario
  try {
    // Already on /es/apartamentos/paloma — scroll to calendar section
    await page.evaluate(() => {
      const cal = document.querySelector('[data-section="calendario"], .calendar, #calendario, [class*="calendar"], [class*="Calendar"]')
      if (cal) cal.scrollIntoView({ behavior: 'instant' })
      else window.scrollBy(0, 900)
    })
    await page.waitForTimeout(800)
    const p = await shot(page, 'apartamento-calendario.png', { clip: { x: 0, y: 0, width: W, height: H_VIEWPORT } })
    log('apartamento-calendario.png', true, fileSize(p))
  } catch (e) { log('apartamento-calendario.png', false, null, e.message) }

  // 5. reservar.png — /es/reservar/paloma
  try {
    await page.goto(`${BASE}/es/reservar/paloma`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'reservar.png', { fullPage: true })
    log('reservar.png', true, fileSize(p))
  } catch (e) { log('reservar.png', false, null, e.message) }

  // 6. informacion.png — /es/informacion, full page
  try {
    await page.goto(`${BASE}/es/informacion`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'informacion.png', { fullPage: true })
    log('informacion.png', true, fileSize(p))
  } catch (e) { log('informacion.png', false, null, e.message) }

  // 7. normas.png — /es/normas, full page
  try {
    await page.goto(`${BASE}/es/normas`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'normas.png', { fullPage: true })
    log('normas.png', true, fileSize(p))
  } catch (e) { log('normas.png', false, null, e.message) }

  // 8. registro.png — /es/registro-viajeros, top viewport
  try {
    await page.goto(`${BASE}/es/registro-viajeros`, { waitUntil: 'domcontentloaded' })
    await waitReady(page)
    const p = await shot(page, 'registro.png', { clip: { x: 0, y: 0, width: W, height: H_VIEWPORT } })
    log('registro.png', true, fileSize(p))
  } catch (e) { log('registro.png', false, null, e.message) }

  await ctx.close()
}

// ─── ADMIN PAGES (need auth cookie) ─────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H_VIEWPORT } })
  const page = await ctx.newPage()

  // Login
  let loggedIn = false
  try {
    await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2500)

    // The Shepherd.js tour renders even on /admin/login and blocks the form.
    // Close it via JS — it intercepts all pointer events via SVG overlay.
    await page.evaluate(() => {
      // Remove overlay SVG and all shepherd elements so the form is interactive
      document.querySelectorAll('[class*="shepherd"]').forEach(el => {
        el.style.pointerEvents = 'none'
        el.style.display = 'none'
        el.remove()
      })
      // Also nuke any fixed/absolute overlays
      document.querySelectorAll('svg').forEach(svg => {
        if (svg.classList.toString().includes('shepherd') || svg.getAttribute('class')?.includes('shepherd')) {
          svg.remove()
        }
      })
    })
    await page.waitForTimeout(500)

    // Fill form via JS to bypass any residual blocking
    await page.evaluate(({ email, password }) => {
      const emailInput = document.querySelector('input[name="email"]')
      const passInput = document.querySelector('input[name="password"]')
      if (emailInput) {
        emailInput.value = email
        emailInput.dispatchEvent(new Event('input', { bubbles: true }))
        emailInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
      if (passInput) {
        passInput.value = password
        passInput.dispatchEvent(new Event('input', { bubbles: true }))
        passInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    await page.waitForTimeout(400)

    // Submit the form
    await page.evaluate(() => {
      document.querySelector('button[type="submit"]')?.click()
    })
    await page.waitForURL(`${BASE}/admin`, { timeout: 15000 })
    await waitReady(page)
    loggedIn = true
    console.log('🔐 Admin login OK')
  } catch (e) {
    console.log('❌ Admin login failed:', e.message)
  }

  if (loggedIn) {
    // 9. admin-dashboard.png — /admin
    try {
      // Dismiss tour if present
      await page.keyboard.press('Escape')
      const closeBtn = page.locator('button.shepherd-cancel-icon').first()
      if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await closeBtn.click()
        await page.waitForTimeout(400)
      }
      const p = await shot(page, 'admin-dashboard.png', { clip: { x: 0, y: 0, width: W, height: H_VIEWPORT } })
      log('admin-dashboard.png', true, fileSize(p))
    } catch (e) { log('admin-dashboard.png', false, null, e.message) }

    // 10. admin-reservas.png — /admin/reservas, full page
    try {
      await page.goto(`${BASE}/admin/reservas`, { waitUntil: 'domcontentloaded' })
      await waitReady(page)
      const p = await shot(page, 'admin-reservas.png', { fullPage: true })
      log('admin-reservas.png', true, fileSize(p))
    } catch (e) { log('admin-reservas.png', false, null, e.message) }

    // 11. admin-disponibilidad.png — /admin/contenido?tab=disponibilidad
    try {
      await page.goto(`${BASE}/admin/contenido?tab=disponibilidad`, { waitUntil: 'domcontentloaded' })
      await waitReady(page)
      const p = await shot(page, 'admin-disponibilidad.png', { fullPage: true })
      log('admin-disponibilidad.png', true, fileSize(p))
    } catch (e) { log('admin-disponibilidad.png', false, null, e.message) }

    // 12. admin-configuracion.png — /admin/configuracion
    try {
      await page.goto(`${BASE}/admin/configuracion`, { waitUntil: 'domcontentloaded' })
      await waitReady(page)
      const p = await shot(page, 'admin-configuracion.png', { fullPage: true })
      log('admin-configuracion.png', true, fileSize(p))
    } catch (e) { log('admin-configuracion.png', false, null, e.message) }
  } else {
    for (const name of ['admin-dashboard.png', 'admin-reservas.png', 'admin-disponibilidad.png', 'admin-configuracion.png']) {
      log(name, false, null, 'login failed')
    }
  }

  await ctx.close()
}

await browser.close()

console.log('\n─── Summary ───────────────────────────────')
const ok = results.filter(r => r.ok)
const fail = results.filter(r => !r.ok)
console.log(`Generated: ${ok.length}/${results.length}`)
if (fail.length) console.log('Failed:', fail.map(r => r.name).join(', '))
