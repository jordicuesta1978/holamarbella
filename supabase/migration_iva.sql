-- HMB-001 — IVA en estancias de corta temporada
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- 1) Parámetros configurables (tabla clave/valor). Se editan desde el admin.
-- 2) La reserva guarda el tipo e importe de IVA aplicados, para que el cálculo
--    quede congelado aunque luego cambien los parámetros.
--    Base alojamiento = total_price - cleaning_fee - extras - iva_importe

CREATE TABLE IF NOT EXISTS parametros (
  clave       TEXT PRIMARY KEY,
  valor       NUMERIC NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO parametros (clave, valor) VALUES
  ('iva_porcentaje', 10),
  ('iva_noches_max', 30)
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE parametros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parametros_read" ON parametros;
CREATE POLICY "parametros_read" ON parametros
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "parametros_write" ON parametros;
CREATE POLICY "parametros_write" ON parametros
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva_importe    INTEGER      NOT NULL DEFAULT 0;
