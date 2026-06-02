#!/usr/bin/env node
/**
 * Crea la tabla minimum_nights en Supabase.
 * Uso: node scripts/migrate-minimum-nights.mjs
 */
import https from 'https'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

// Use Supabase SQL endpoint
const sql = `
CREATE TABLE IF NOT EXISTS minimum_nights (
  id SERIAL PRIMARY KEY,
  apartment_slug TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  min_nights INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS minimum_nights_slug_idx ON minimum_nights(apartment_slug);
`

const body = JSON.stringify({ query: sql })
const url = new globalThis.URL('/rest/v1/rpc/exec_sql', SUPABASE_URL)

// Use the management API instead
const mgmtUrl = SUPABASE_URL.replace('.supabase.co', '.supabase.co')
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]

console.log('Project ref:', projectRef)
console.log('Creating minimum_nights table...')

const opts = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(body),
  },
}

const req = https.request(opts, res => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    console.log('Response:', data.slice(0, 300))
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Tabla minimum_nights creada correctamente')
    } else {
      console.log('⚠️  Puede que ya exista o se necesite crear desde el Dashboard de Supabase')
      console.log('SQL a ejecutar manualmente en el Editor SQL de Supabase:')
      console.log(sql)
    }
  })
})
req.on('error', e => {
  console.error('Error:', e.message)
  console.log('\nSQL para ejecutar manualmente en Supabase Dashboard → SQL Editor:')
  console.log(sql)
})
req.write(body)
req.end()
