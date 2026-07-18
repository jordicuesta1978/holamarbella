-- Hace opcionales todos los campos de resenas excepto author y rating
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE resenas
  ALTER COLUMN apartment_slug DROP NOT NULL,
  ALTER COLUMN location DROP NOT NULL,
  ALTER COLUMN date DROP NOT NULL,
  ALTER COLUMN text DROP NOT NULL;
