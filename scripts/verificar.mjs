#!/usr/bin/env node
/**
 * Verificación automática de HolaMarbella con Playwright.
 * Uso: node scripts/verificar.mjs [--base https://holamarbella.vercel.app]
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const baseArg = args.indexOf('--base')
const BASE = baseArg >= 0 ? args[baseArg + 1] : 'https://holamarbella.vercel.app'
const SCREENSHOTS = path.join(__dirname, 'screenshots')
if (!existsSync(SCREENSHOTS)) mkdirSync(SCREENSHOTS, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const results = []

async function check(browser, name, url, checks, opts = {}) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 900 })
  const passed = []
  const failed = []
  let screenshotFile = null

  try {
    const res = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = res?.status() ?? 0
    if (status >= 400 && !opts.allowHttpErrors) {
      failed.push(`HTTP ${status}`)
    } else {
      await page.waitForTimeout(2500)
      const fname = `${timestamp}_${name.replace(/[^a-z0-9]/gi, '_')}.png`
      screenshotFile = path.join(SCREENSHOTS, fname)
      await page.screenshot({ path: screenshotFile, fullPage: false })
      screenshotFile = fname

      for (const { desc, fn } of checks) {
        try {
          await fn(page)
          passed.push(desc)
        } catch (e) {
          failed.push(`${desc} → ${e.message.split('\n')[0].slice(0, 120)}`)
        }
      }
    }
  } catch (e) {
    failed.push(`Carga fallida: ${e.message.split('\n')[0].slice(0, 120)}`)
  } finally {
    await page.close()
  }

  results.push({ name, url, passed, failed, screenshot: screenshotFile })
}

// ── Tests ────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true })

await check(browser, 'Home', '/', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: '"Apartamento Paloma" visible', fn: async p => {
    await p.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
    const t = await p.textContent('body')
    if (!t?.includes('Apartamento Paloma')) throw new Error('"Apartamento Paloma" no encontrado en página')
  }},
  { desc: '"Apartamento Micu" visible', fn: async p => {
    const t = await p.textContent('body')
    if (!t?.includes('Apartamento Micu')) throw new Error('"Apartamento Micu" no encontrado en página')
  }},
  { desc: 'Buscador con fechas', fn: p => p.locator('input[name="checkIn"]').first().waitFor({ timeout: 5000 }) },
  { desc: 'Sin "por Mar"', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('por Mar')) throw new Error('"por Mar" encontrado en página')
  }},
  { desc: 'Flex pills per-date (±1, ±2)', fn: async p => {
    const t = await p.textContent('body')
    if (!t?.includes('±1') || !t?.includes('±2')) throw new Error('Pills de flexibilidad por fecha no encontradas')
  }},
])

await check(browser, 'Apartamentos', '/apartamentos', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: '"Apartamento Paloma" en tarjeta H3', fn: p => p.locator('h3:has-text("Apartamento Paloma")').waitFor({ timeout: 8000 }) },
  { desc: '"Apartamento Micu" en tarjeta H3', fn: p => p.locator('h3:has-text("Apartamento Micu")').waitFor({ timeout: 5000 }) },
  { desc: 'Nombre en H3 con color verde (--primary)', fn: async p => {
    const el = p.locator('h3:has-text("Apartamento Paloma")').first()
    await el.waitFor({ timeout: 5000 })
    const color = await el.evaluate(e => window.getComputedStyle(e).color)
    // var(--primary) = #4B766B = rgb(75, 118, 107)
    if (!color.includes('75') && !color.includes('4B766B') && !color.includes('4b766b')) {
      throw new Error(`Color H3 inesperado: ${color} (esperado verde ~rgb(75, 118, 107))`)
    }
  }},
  { desc: 'Subtítulo descriptivo visible', fn: p => p.locator('text=Centro · Playa').first().waitFor({ timeout: 5000 }) },
  { desc: 'Sin badges TOP AIRBNB', fn: async p => {
    const t = await p.textContent('body')
    if (t?.toLowerCase().includes('airbnb') && t?.toLowerCase().includes('%')) throw new Error('Badge Airbnb encontrado')
  }},
])

await check(browser, 'Detalle Paloma', '/apartamentos/paloma', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: 'H1 "Apartamento Paloma"', fn: p => p.locator('h1:has-text("Apartamento Paloma")').waitFor({ timeout: 8000 }) },
  { desc: 'Subtítulo descriptivo', fn: p => p.locator('text=Centro · Playa').first().waitFor({ timeout: 5000 }) },
  { desc: 'Sección Ubicación con mapa', fn: p => p.locator('text=Ubicación').first().waitFor({ timeout: 5000 }) },
  { desc: 'Botón "Solicitar reserva"', fn: p => p.locator('text=Solicitar reserva').first().waitFor({ timeout: 5000 }) },
  { desc: 'Sin "Anfitriona: Mar"', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('Anfitriona: Mar') || t?.includes('Airbnb Superhost')) throw new Error('"Anfitriona: Mar" aún aparece en la página de detalle')
  }},
])

await check(browser, 'Reservar Paloma', '/reservar/paloma', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: 'Formulario visible', fn: p => p.locator('h1:has-text("Solicitar reserva")').waitFor({ timeout: 8000 }) },
  { desc: '"Apartamento Paloma" en resumen', fn: p => p.locator('text=Apartamento Paloma').first().waitFor({ timeout: 5000 }) },
  { desc: 'Campo nombre', fn: p => p.locator('input[placeholder*="nombre"]').waitFor({ timeout: 5000 }) },
  { desc: 'Campo email', fn: p => p.locator('input[type="email"]').waitFor({ timeout: 5000 }) },
])

await check(browser, 'Confirmacion (vacía)', '/confirmacion', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: 'Sin error de aplicación', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('Application error') || t?.includes('Internal Server Error')) throw new Error('Error de aplicación detectado')
  }},
  { desc: '"Solicitud enviada" visible', fn: p => p.locator('text=Solicitud enviada').first().waitFor({ timeout: 5000 }) },
])

await check(browser, 'Admin login', '/admin/login', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: 'Campo email', fn: p => p.locator('input[type="email"]').waitFor({ timeout: 8000 }) },
  { desc: 'Campo contraseña', fn: p => p.locator('input[type="password"]').waitFor({ timeout: 5000 }) },
])

await check(browser, 'Reservar Micu (detalle)', '/apartamentos/micu', [
  { desc: 'H1 "Apartamento Micu"', fn: p => p.locator('h1:has-text("Apartamento Micu")').waitFor({ timeout: 8000 }) },
])

await check(browser, 'API Pagar (ruta existe)', '/api/pagar/token-inexistente', [
  { desc: 'Ruta redirige a /conversacion (no se queda en /api/pagar)', fn: async p => {
    // Si la ruta existe, redirige a /conversacion/[token] (que puede dar 404 por token inválido)
    // Lo importante: la URL cambió de /api/pagar → confirmamos que la ruta existe
    const url = p.url()
    if (url.includes('/api/pagar/token-inexistente')) throw new Error('Ruta no existe en el deploy — URL no cambió')
    // Si llegó a /conversacion/token-inexistente y da 404, la ruta funciona correctamente
  }},
], { allowHttpErrors: true })

await check(browser, 'Admin contenido', '/admin/contenido', [
  { desc: 'Carga sin error (redirige a login o contenido)', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('Application error') || t?.includes('Internal Server Error')) throw new Error('Error de aplicación')
  }},
])

await check(browser, 'Admin contenido apartamentos', '/admin/contenido/apartamentos', [
  { desc: 'Carga sin error de aplicación', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('Application error') || t?.includes('Internal Server Error')) throw new Error('Error de aplicación')
  }},
  { desc: 'Redirige a login o muestra galería (sin 500)', fn: async p => {
    // Unauthenticated → redirected to /admin/login; authenticated → shows gallery
    const url = p.url()
    const t = await p.textContent('body')
    if (t?.includes('Application error') || t?.includes('Internal Server Error')) throw new Error('Error de aplicación')
    if (!url.includes('/admin/login') && !url.includes('/admin/contenido') && !t?.includes('Galería')) {
      throw new Error(`URL inesperada: ${url}`)
    }
  }},
])

await check(browser, 'Detalle con fechas', '/apartamentos/paloma?checkin=2026-07-01&checkout=2026-07-07', [
  { desc: 'Carga con fechas en URL', fn: p => p.waitForSelector('body') },
  { desc: 'Fecha llegada pre-rellenada', fn: async p => {
    await p.waitForTimeout(1000)
    const val = await p.locator('input[type="date"]').first().inputValue()
    if (!val) throw new Error('Fecha de llegada vacía (no pre-rellenada)')
  }},
])

await check(browser, '/informacion (blog)', '/informacion', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: 'Sin error de aplicación', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('Application error') || t?.includes('Internal Server Error')) throw new Error('Error de aplicación')
  }},
])

await check(browser, '/apartamentos con fechas', '/apartamentos?checkIn=2026-07-01&checkOut=2026-07-07', [
  { desc: 'Carga sin error de servidor', fn: async p => {
    const t = await p.textContent('body')
    if (t?.includes('Application error') || t?.includes('Internal Server Error')) throw new Error('Error de aplicación')
  }},
  { desc: 'Muestra apartamentos', fn: p => p.locator('h2').first().waitFor({ timeout: 8000 }) },
])

await check(browser, 'Reservar Micu (envío form)', '/reservar/micu', [
  { desc: 'Formulario carga', fn: p => p.locator('h1:has-text("Solicitar reserva")').waitFor({ timeout: 8000 }) },
  { desc: 'Botón enviar visible y sin error previo', fn: async p => {
    await p.waitForTimeout(500)
    const btn = await p.locator('button[type="submit"]').first()
    await btn.waitFor({ timeout: 5000 })
    const text = await btn.textContent()
    if (text?.includes('Application error')) throw new Error('Error de aplicación en botón')
  }},
])

await browser.close()

// ── Informe ──────────────────────────────────────────────────────────────────

const sep = '═'.repeat(64)
const lines = [
  sep,
  `  INFORME DE VERIFICACIÓN — HolaMarbella`,
  `  ${new Date().toLocaleString('es-ES')}`,
  `  Base URL: ${BASE}`,
  sep,
]

let totalOk = 0, totalFail = 0
for (const r of results) {
  const icon = r.failed.length === 0 ? '✅' : r.passed.length === 0 ? '❌' : '⚠️'
  lines.push(`\n${icon}  ${r.name}  (${r.url})`)
  r.passed.forEach(p => { lines.push(`   ✓ ${p}`); totalOk++ })
  r.failed.forEach(f => { lines.push(`   ✗ ${f}`); totalFail++ })
  if (r.screenshot) lines.push(`   📸 scripts/screenshots/${r.screenshot}`)
}

lines.push(`\n${sep}`)
lines.push(`  Resultado: ${totalOk} OK  ·  ${totalFail} fallos`)
lines.push(sep)

const report = lines.join('\n')
console.log(report)

const reportPath = path.join(__dirname, `informe_${timestamp}.txt`)
writeFileSync(reportPath, report, 'utf8')
console.log(`\nInforme guardado: scripts/informe_${timestamp}.txt`)

process.exit(totalFail > 0 ? 1 : 0)
