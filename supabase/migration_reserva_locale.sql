-- Guarda el idioma (ES/EN) en que el huésped navegó la web al hacer la solicitud,
-- para poder enviar los emails transaccionales en su idioma.
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'es' CHECK (locale IN ('es', 'en'));
