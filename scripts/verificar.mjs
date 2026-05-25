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

async function check(browser, name, url, checks) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 900 })
  const passed = []
  const failed = []
  let screenshotFile = null

  try {
    const res = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = res?.status() ?? 0
    if (status >= 400) {
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
])

await check(browser, 'Apartamentos', '/apartamentos', [
  { desc: 'Carga sin error', fn: p => p.waitForSelector('body') },
  { desc: '"Apartamento Paloma" en tarjeta', fn: p => p.locator('h2:has-text("Apartamento Paloma")').waitFor({ timeout: 8000 }) },
  { desc: '"Apartamento Micu" en tarjeta', fn: p => p.locator('h2:has-text("Apartamento Micu")').waitFor({ timeout: 5000 }) },
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

await check(browser, 'Detalle con fechas', '/apartamentos/paloma?checkin=2026-07-01&checkout=2026-07-07', [
  { desc: 'Carga con fechas en URL', fn: p => p.waitForSelector('body') },
  { desc: 'Fecha llegada pre-rellenada', fn: async p => {
    await p.waitForTimeout(1000)
    const val = await p.locator('input[type="date"]').first().inputValue()
    if (!val) throw new Error('Fecha de llegada vacía (no pre-rellenada)')
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
