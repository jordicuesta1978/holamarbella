-- ============================================================
-- HolaMarbella — Migración: traducciones de apartamentos (multiidioma)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================
-- Tabla escalable de traducciones por apartamento e idioma.
-- El contenido ES sigue viviendo en `apartments` (idioma base / fallback).
-- Cada fila aquí es la traducción de un apartamento a un locale concreto.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS apartment_translations (
  id              SERIAL PRIMARY KEY,
  apartment_slug  TEXT NOT NULL,
  locale          TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  key_features    TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (apartment_slug, locale)
);

ALTER TABLE apartment_translations ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la web pública necesita leer las traducciones)
DROP POLICY IF EXISTS "translations_read" ON apartment_translations;
CREATE POLICY "translations_read" ON apartment_translations
  FOR SELECT USING (true);

-- Escritura solo desde el backend (service_role bypassa RLS de todos modos;
-- esta policy deja explícito que ningún cliente anónimo puede escribir)
DROP POLICY IF EXISTS "translations_write" ON apartment_translations;
CREATE POLICY "translations_write" ON apartment_translations
  FOR ALL USING (auth.role() = 'service_role');
