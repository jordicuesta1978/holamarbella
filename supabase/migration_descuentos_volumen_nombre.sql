-- Nombre opcional por regla de descuento, para mostrarlo en el desglose de precio
-- (si se deja vacío, se usa la etiqueta genérica "Descuento estancia larga")
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE descuentos_volumen
  ADD COLUMN IF NOT EXISTS nombre TEXT;
