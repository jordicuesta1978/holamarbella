-- Descuentos automáticos por volumen de noches, por apartamento y rango de fechas
-- Ejecutar en: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS descuentos_volumen (
  id               SERIAL PRIMARY KEY,
  apartment_slug   TEXT NOT NULL REFERENCES apartments(slug) ON DELETE CASCADE,
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  noches_minimas   INTEGER NOT NULL,
  porcentaje       NUMERIC(5,2) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS descuentos_volumen_slug_idx ON descuentos_volumen(apartment_slug);

ALTER TABLE descuentos_volumen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "descuentos_volumen_read" ON descuentos_volumen;
CREATE POLICY "descuentos_volumen_read" ON descuentos_volumen
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "descuentos_volumen_write" ON descuentos_volumen;
CREATE POLICY "descuentos_volumen_write" ON descuentos_volumen
  FOR ALL USING (auth.role() = 'service_role');
