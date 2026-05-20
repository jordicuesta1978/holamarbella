-- Añadir campos de pricing a la tabla reservas
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS cleaning_fee INTEGER NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS extras       JSONB    NOT NULL DEFAULT '[]';
