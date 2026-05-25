#!/usr/bin/env node
/**
 * Migración SQL para el Gestor de Contenido.
 * Uso: node scripts/migrate_contenido.mjs TU_PAT_SUPABASE
 *
 * 1. Ve a supabase.com → Account → Access Tokens → Generate new token
 * 2. Ejecuta este script con ese token
 * 3. Revoca el token desde el dashboard una vez terminado
 */

const PAT = process.argv[2]
const PROJECT_REF = 'kftyemxltrzxafzpyafh'

if (!PAT) {
  console.error('❌  Uso: node scripts/migrate_contenido.mjs TU_PAT_SUPABASE')
  process.exit(1)
}

const SQL = `
-- Tarifa de limpieza por apartamento
CREATE TABLE IF NOT EXISTS configuracion (
  apartment_slug TEXT PRIMARY KEY,
  cleaning_fee INTEGER NOT NULL DEFAULT 40,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarifas de precio por rango de fechas
CREATE TABLE IF NOT EXISTS precios (
  id BIGSERIAL PRIMARY KEY,
  apartment_slug TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  precio_noche INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_precios_slug ON precios(apartment_slug);

-- Bloqueos manuales de disponibilidad
CREATE TABLE IF NOT EXISTS bloqueos (
  id BIGSERIAL PRIMARY KEY,
  apartment_slug TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bloqueos_slug ON bloqueos(apartment_slug);

-- Artículos de blog para /informacion
CREATE TABLE IF NOT EXISTS articulos (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  contenido TEXT NOT NULL DEFAULT '',
  publicado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='configuracion' AND policyname='public_read_configuracion') THEN
    CREATE POLICY public_read_configuracion ON configuracion FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='configuracion' AND policyname='service_all_configuracion') THEN
    CREATE POLICY service_all_configuracion ON configuracion FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='precios' AND policyname='public_read_precios') THEN
    CREATE POLICY public_read_precios ON precios FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='precios' AND policyname='service_all_precios') THEN
    CREATE POLICY service_all_precios ON precios FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bloqueos' AND policyname='service_all_bloqueos') THEN
    CREATE POLICY service_all_bloqueos ON bloqueos FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='articulos' AND policyname='public_read_articulos') THEN
    CREATE POLICY public_read_articulos ON articulos FOR SELECT TO anon USING (publicado = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='articulos' AND policyname='service_all_articulos') THEN
    CREATE POLICY service_all_articulos ON articulos FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- Datos iniciales: cleaning fee 40€ por defecto en todos los apartamentos
INSERT INTO configuracion (apartment_slug, cleaning_fee) VALUES
  ('paloma', 40), ('micu', 40), ('larysol', 40), ('ami', 40), ('banesto', 40)
ON CONFLICT (apartment_slug) DO NOTHING;
`

console.log('🔄  Ejecutando migración...')
console.log(`    Proyecto: ${PROJECT_REF}`)
console.log(`    Tablas: configuracion, precios, bloqueos, articulos\n`)

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: SQL }),
})

const body = await res.text()

if (res.ok) {
  console.log('✅  Migración completada con éxito.')
  console.log('\n⚠️   IMPORTANTE: Revoca el token desde supabase.com → Account → Access Tokens')
} else {
  console.error(`❌  Error ${res.status}:`, body)
  process.exit(1)
}
