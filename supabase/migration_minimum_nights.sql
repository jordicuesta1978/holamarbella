-- Tabla de noches mínimas por apartamento y rango de fechas
-- Ejecutar en: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS minimum_nights (
  id           SERIAL PRIMARY KEY,
  apartment_slug TEXT NOT NULL,
  start_date   DATE,          -- NULL = aplica siempre (valor por defecto)
  end_date     DATE,          -- NULL = aplica siempre
  min_nights   INTEGER NOT NULL DEFAULT 2,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS minimum_nights_slug_idx ON minimum_nights(apartment_slug);

-- Habilitar RLS
ALTER TABLE minimum_nights ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública (para mostrar en el calendario público)
DROP POLICY IF EXISTS "minimum_nights_read" ON minimum_nights;
CREATE POLICY "minimum_nights_read" ON minimum_nights
  FOR SELECT USING (true);

-- Política: escritura solo para service role (admin)
DROP POLICY IF EXISTS "minimum_nights_write" ON minimum_nights;
CREATE POLICY "minimum_nights_write" ON minimum_nights
  FOR ALL USING (auth.role() = 'service_role');
