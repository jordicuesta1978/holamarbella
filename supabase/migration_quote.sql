-- Flujo de presupuesto: solicitud -> presupuesto enviado -> presupuesto aceptado -> confirmada
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- (Ejecutar después de migration_pricing.sql y migration_deposit.sql)

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS quote_message    TEXT,
  ADD COLUMN IF NOT EXISTS quote_token      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS quote_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_accepted_at TIMESTAMPTZ;

-- Ampliar los estados permitidos para incluir el ciclo de presupuesto
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_status_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_status_check
  CHECK (status IN ('pending','quote_sent','quote_accepted','confirmed','cancelled','blocked'));
