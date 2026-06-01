/**
 * backfill-booking-refs.mjs
 * Rellena booking_ref para reservas con NULL en DB.
 * Usa el mismo formato que generateDailyBookingRef: YYYYMMDDXXXNN
 * Ejecutar: node scripts/backfill-booking-refs.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// --- leer .env.local ---
const envPath = resolve(process.cwd(), '.env.local')
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
}

const APT_CODES = {
  paloma: 'PAL',
  larysol: 'LAR',
  micu: 'MIC',
  ami: 'AMI',
  banesto: 'BAN',
}

function dateCode(checkIn) {
  return checkIn.slice(0, 10).replace(/-/g, '')
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { ...HEADERS, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function supabasePatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function generateRef(id, slug, checkIn) {
  const date = dateCode(checkIn)
  const code = APT_CODES[slug] ?? slug.slice(0, 3).toUpperCase()
  const prefix = `${date}${code}`

  // Contar refs existentes con este prefijo (excluir la reserva actual)
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/reservas?select=id&booking_ref=like.${prefix}%25&id=neq.${id}`,
    { headers: { ...HEADERS, Accept: 'application/json', Prefer: 'count=exact' } }
  )
  const countHeader = countRes.headers.get('content-range') // e.g. "0-8/9"
  const total = countHeader ? parseInt(countHeader.split('/')[1] ?? '0', 10) : 0

  const counter = String(total + 1).padStart(2, '0')
  return `${prefix}${counter}`
}

async function main() {
  console.log('════════════════════════════════════════════════')
  console.log('  BACKFILL booking_ref — HolaMarbella')
  console.log('════════════════════════════════════════════════\n')

  // 1. Obtener reservas sin booking_ref
  const nullRows = await supabaseGet(
    'reservas?select=id,apartment_slug,check_in,created_at,status&booking_ref=is.null&order=id.asc'
  )

  console.log(`📋 Reservas con booking_ref = NULL: ${nullRows.length}`)
  if (nullRows.length === 0) {
    console.log('✅ Nada que actualizar. Todas las reservas ya tienen booking_ref.')
    return
  }

  console.log('')

  const results = []
  let ok = 0
  let fail = 0

  for (const r of nullRows) {
    const dateSource = r.check_in || r.created_at
    if (!dateSource) {
      console.log(`  ⚠️  ID ${r.id} (${r.apartment_slug}): sin check_in ni created_at — skip`)
      fail++
      continue
    }

    try {
      const ref = await generateRef(r.id, r.apartment_slug, dateSource)

      // Verificar que la ref no exista ya (colisión)
      const existing = await supabaseGet(`reservas?select=id&booking_ref=eq.${ref}`)
      if (existing.length > 0 && existing[0].id !== r.id) {
        // Colisión: añadir sufijo extra
        const refAlt = ref.slice(0, -2) + String(parseInt(ref.slice(-2)) + 10).padStart(2, '0')
        console.log(`  ⚠️  ID ${r.id}: colisión en ${ref} → usando ${refAlt}`)
        await supabasePatch(`reservas?id=eq.${r.id}`, { booking_ref: refAlt })
        results.push({ id: r.id, slug: r.apartment_slug, checkIn: r.check_in, ref: refAlt, status: r.status })
        ok++
      } else {
        await supabasePatch(`reservas?id=eq.${r.id}`, { booking_ref: ref })
        results.push({ id: r.id, slug: r.apartment_slug, checkIn: r.check_in, ref, status: r.status })
        console.log(`  ✅  ID ${r.id.toString().padStart(4)} | ${r.apartment_slug.padEnd(8)} | check_in: ${(r.check_in || '(sin fecha)').padEnd(12)} | → ${ref}  [${r.status}]`)
        ok++
      }
    } catch (err) {
      console.log(`  ❌  ID ${r.id}: ${err.message}`)
      fail++
    }
  }

  console.log('\n════════════════════════════════════════════════')
  console.log(`  Resultado: ${ok} actualizadas · ${fail} fallidas`)
  console.log('════════════════════════════════════════════════\n')

  // 2. Verificación post-backfill
  console.log('📋 Verificación: reservas sin booking_ref tras backfill…')
  const remaining = await supabaseGet('reservas?select=id&booking_ref=is.null')
  if (remaining.length === 0) {
    console.log('✅ Todas las reservas tienen booking_ref. ¡Backfill completo!\n')
  } else {
    console.log(`⚠️  Quedan ${remaining.length} reservas sin booking_ref: IDs ${remaining.map(r => r.id).join(', ')}\n`)
  }

  // 3. Mostrar tabla final de refs generadas
  if (results.length > 0) {
    console.log('📑 Refs generadas en esta ejecución:')
    console.log('  ─────────────────────────────────────────────')
    for (const r of results) {
      console.log(`  ${r.ref}  →  ID ${r.id} (${r.slug}) check_in ${r.checkIn || 'N/A'} [${r.status}]`)
    }
    console.log('  ─────────────────────────────────────────────')
  }
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
