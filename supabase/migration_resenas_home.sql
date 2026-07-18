-- Añade soporte para marcar fuente y destacar reseñas en la home
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE resenas
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('airbnb','google') OR source IS NULL),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS resenas_featured_idx ON resenas(featured);
