-- Ubicación en el mapa de cada apartamento (para apartamentos creados desde el gestor).
-- Los originales siguen usando las coordenadas fijas del código si esto está vacío.
ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
