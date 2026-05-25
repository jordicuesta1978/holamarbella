#!/usr/bin/env node
/**
 * Migraciones v2 — nuevas columnas para el CMS completo.
 * Uso: node scripts/migrate_v2.mjs TU_PAT_SUPABASE
 *
 * 1. Ve a supabase.com → Account → Access Tokens → Generate new token
 * 2. Ejecuta este script con ese token
 * 3. Revoca el token desde el dashboard una vez terminado
 */

const PAT = process.argv[2]
const PROJECT_REF = 'kftyemxltrzxafzpyafh'

if (!PAT) {
  console.error('❌  Uso: node scripts/migrate_v2.mjs TU_PAT_SUPABASE')
  process.exit(1)
}

const SQL = `
-- Apartments: tarifa de limpieza y estado activo/inactivo
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS cleaning_fee INTEGER NOT NULL DEFAULT 40;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Resenas: orden personalizable
ALTER TABLE resenas ADD COLUMN IF NOT EXISTS sort_order INTEGER;
UPDATE resenas SET sort_order = id WHERE sort_order IS NULL;

-- Articulos: imagen destacada
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
`

const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

console.log('🔄  Ejecutando migraciones v2...')
console.log(`    Proyecto: ${PROJECT_REF}`)
console.log(`    Cambios: apartments (cleaning_fee, active), resenas (sort_order), articulos (imagen_url)\n`)

const res = await fetch(API, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: SQL }),
})

const body = await res.text()

if (res.ok) {
  console.log('✅  Migraciones v2 completadas.')
  console.log('\n⚠️   IMPORTANTE: Revoca el token desde supabase.com → Account → Access Tokens')
} else {
  console.error(`❌  Error ${res.status}:`, body)
  process.exit(1)
}
