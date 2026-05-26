#!/usr/bin/env node
/**
 * Migración de nombres completos de apartamentos en Supabase.
 * Actualiza title, subtitle y datos de cama a los valores definitivos.
 * Uso: node scripts/migrate-apt-names.mjs
 */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const updates = [
  {
    slug: 'paloma',
    title: 'Apartamento Paloma',
    subtitle: 'Centro · Playa con vistas espectaculares',
  },
  {
    slug: 'micu',
    title: 'Apartamento Micu',
    subtitle: 'Casco Antiguo · Playa · Vistas al mar',
  },
  {
    slug: 'larysol',
    title: 'Apartamento Larysol',
    subtitle: 'Playa de la Fontanilla · Centro',
  },
  {
    slug: 'ami',
    title: 'Ático AMI',
    subtitle: 'Casco Antiguo · Vistas a La Concha',
    bed: '1 cama 1,80m',
    bed_extras: 'Vestidor con escritorio',
  },
  {
    slug: 'banesto',
    title: 'Ático Banesto',
    subtitle: 'La Alameda · Centro y Playa',
    bed: '1 cama 1,80m',
    bed_extras: 'Baño en suite',
  },
]

async function patch(slug, fields) {
  const { slug: _, ...body } = fields
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/apartments?slug=eq.${slug}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`PATCH ${slug} failed: ${JSON.stringify(json)}`)
  return json
}

console.log('Migrando nombres de apartamentos...\n')

let ok = 0, err = 0
for (const update of updates) {
  try {
    await patch(update.slug, update)
    console.log(`✓ ${update.slug} → "${update.title}"`)
    ok++
  } catch (e) {
    console.error(`✗ ${update.slug}: ${e.message}`)
    err++
  }
}

console.log(`\n${ok} OK · ${err} errores`)
if (err > 0) process.exit(1)
