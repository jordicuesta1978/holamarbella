/**
 * verify-pagar.mjs — Verifica el flow "Pagar ahora" en producción
 * Uso: node scripts/verify-pagar.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const BASE_URL = 'https://holamarbella.vercel.app'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''

// Reserva confirmed con payment_request: ID 6, token 2522627c-d613-46dc-8697-ee40d1369c64
const RESERVA_ID = 6
const RESERVA_TOKEN = '2522627c-d613-46dc-8697-ee40d1369c64'
const ADMIN_RESERVA_URL = `${BASE_URL}/admin/reservas/${RESERVA_ID}`
const GUEST_CONV_URL = `${BASE_URL}/conversacion/${RESERVA_TOKEN}`
const API_PAGAR_URL = `${BASE_URL}/api/pagar/${RESERVA_TOKEN}`

const TS = new Date().toISOString().slice(0,19).replace(/:/g,'-')
const SHOTS_DIR = `scripts/screenshots/${TS}_pagar`
mkdirSync(SHOTS_DIR, { recursive: true })

const log = (msg) => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`)

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Track redirects
  })
  const page = await ctx.newPage()
  const results = []

  // ── PASO 1: Verificar que /admin/reservas carga y muestra la reserva ──────
  log('PASO 1: /admin/reservas')
  let adminLoginNeeded = false
  try {
    const resp = await page.goto(`${BASE_URL}/admin/reservas`, { waitUntil: 'networkidle', timeout: 15000 })
    const finalUrl = page.url()
    log(`  → URL final: ${finalUrl}`)
    const title = await page.title()
    log(`  → Título: ${title}`)
    await page.screenshot({ path: `${SHOTS_DIR}/01_admin_reservas.png` })

    if (finalUrl.includes('/admin/login') || finalUrl.includes('/login')) {
      adminLoginNeeded = true
      results.push({ paso: 1, ok: false, msg: 'Redirigido a login — necesita auth', url: finalUrl })
      log('  ⚠️  Requiere autenticación')
    } else {
      results.push({ paso: 1, ok: true, msg: 'Admin reservas cargó', url: finalUrl })
      log('  ✅ Admin reservas OK')
    }
  } catch(e) {
    results.push({ paso: 1, ok: false, msg: String(e), url: page.url() })
    log(`  ❌ Error: ${e}`)
  }

  // ── PASO 2: Página guest /conversacion/[token] ────────────────────────────
  log('PASO 2: /conversacion/[token]')
  try {
    await page.goto(GUEST_CONV_URL, { waitUntil: 'networkidle', timeout: 15000 })
    const finalUrl = page.url()
    log(`  → URL: ${finalUrl}`)
    const title = await page.title()
    log(`  → Título: ${title}`)
    const bodyText = await page.textContent('body')
    const hasPagarBtn = bodyText.includes('Pagar') && bodyText.includes('€')
    log(`  → ¿Botón pagar visible? ${hasPagarBtn}`)
    await page.screenshot({ path: `${SHOTS_DIR}/02_conversacion_guest.png` })

    if (finalUrl.includes('notfound') || finalUrl.includes('404')) {
      results.push({ paso: 2, ok: false, msg: '404 en conversacion page', url: finalUrl })
    } else {
      results.push({ paso: 2, ok: true, msg: `Conversacion cargó. Botón pagar: ${hasPagarBtn}`, url: finalUrl })
      log(`  ✅ Conversacion OK, pagar visible: ${hasPagarBtn}`)
    }
  } catch(e) {
    results.push({ paso: 2, ok: false, msg: String(e), url: page.url() })
    log(`  ❌ Error: ${e}`)
  }

  // ── PASO 3: Clic en "Pagar ahora" (si existe el botón) ───────────────────
  log('PASO 3: Clic en botón Pagar')
  try {
    // Find the pay button
    const pagarBtn = await page.$('button:has-text("Pagar")')
    if (!pagarBtn) {
      results.push({ paso: 3, ok: false, msg: 'Botón Pagar no encontrado en la página', url: page.url() })
      log('  ⚠️  Botón Pagar no encontrado')
    } else {
      const btnText = await pagarBtn.textContent()
      log(`  → Botón encontrado: "${btnText?.trim()}"`)

      // Track navigation
      const navigationPromise = page.waitForNavigation({ timeout: 15000 })
        .catch(e => ({ error: e.message }))

      await pagarBtn.click()
      const navResult = await navigationPromise

      const finalUrl = page.url()
      log(`  → URL después del clic: ${finalUrl}`)

      await page.screenshot({ path: `${SHOTS_DIR}/03_despues_clic_pagar.png` })

      const isStripe = finalUrl.includes('checkout.stripe.com')
      const is404 = finalUrl.includes('404') || (await page.title()).includes('404')

      results.push({
        paso: 3,
        ok: isStripe,
        msg: isStripe ? '✅ Redirigido a Stripe' : (is404 ? '❌ 404' : `⚠️ URL inesperada: ${finalUrl}`),
        url: finalUrl,
        isStripe
      })

      if (isStripe) {
        log(`  ✅ STRIPE URL: ${finalUrl.slice(0, 80)}...`)
      } else {
        log(`  ❌ NO redirigió a Stripe: ${finalUrl}`)
      }
    }
  } catch(e) {
    results.push({ paso: 3, ok: false, msg: String(e), url: page.url() })
    log(`  ❌ Error: ${e}`)
  }

  // ── PASO 4: Verificar /api/pagar/[token] directo (fallback GET) ──────────
  log('PASO 4: GET /api/pagar/[token] directo')
  const page2 = await ctx.newPage()
  try {
    const finalRedirectUrl = { url: '' }
    page2.on('response', resp => {
      if (resp.status() >= 300 && resp.status() < 400) {
        log(`  → Redirect ${resp.status()}: ${resp.headers()['location'] || ''}`)
      }
    })

    await page2.goto(API_PAGAR_URL, { waitUntil: 'load', timeout: 20000 })
    const finalUrl = page2.url()
    log(`  → URL final: ${finalUrl}`)
    await page2.screenshot({ path: `${SHOTS_DIR}/04_api_pagar_direct.png` })

    const isStripe = finalUrl.includes('checkout.stripe.com')
    const isConversacion = finalUrl.includes('/conversacion/')
    const status = (await page2.evaluate(() => document.title)) || ''

    results.push({
      paso: 4,
      ok: isStripe,
      msg: isStripe ? `Redirigió a Stripe` : (isConversacion ? 'Redirigió a /conversacion/ (Stripe falló)' : `URL: ${finalUrl}`),
      url: finalUrl,
      isStripe
    })

    if (isStripe) {
      log(`  ✅ Stripe URL: ${finalUrl.slice(0,100)}`)
    } else if (isConversacion) {
      log(`  ❌ Stripe falló — devuelto a /conversacion/ (catch en route handler)`)
    } else {
      log(`  ⚠️  URL inesperada: ${finalUrl}`)
    }
  } catch(e) {
    results.push({ paso: 4, ok: false, msg: String(e), url: page2.url() })
    log(`  ❌ Error: ${e}`)
  }

  await browser.close()

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════')
  console.log('RESUMEN VERIFICACIÓN "PAGAR AHORA"')
  console.log('══════════════════════════════════════════════')
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌'
    console.log(`${icon} Paso ${r.paso}: ${r.msg}`)
    if (!r.ok) console.log(`   URL: ${r.url}`)
    if (r.isStripe && r.url) console.log(`   STRIPE URL: ${r.url}`)
  })
  console.log('\nScreenshots:', SHOTS_DIR)

  // Write JSON report
  writeFileSync(`${SHOTS_DIR}/results.json`, JSON.stringify(results, null, 2))

  const allOk = results.every(r => r.ok)
  process.exit(allOk ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
