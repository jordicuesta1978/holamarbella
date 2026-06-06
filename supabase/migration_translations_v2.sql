-- ============================================================
-- HolaMarbella — Migración v2: traducciones de apartamentos
-- Añade nombre y amenidades traducibles a apartment_translations.
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE apartment_translations
  ADD COLUMN IF NOT EXISTS name          TEXT;

ALTER TABLE apartment_translations
  ADD COLUMN IF NOT EXISTS top_amenities TEXT[];
