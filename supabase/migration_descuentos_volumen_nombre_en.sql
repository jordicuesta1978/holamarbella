-- Nombre en inglés opcional por regla de descuento, para mostrarlo al huésped
-- según el idioma en que navegó la web (si se deja vacío, se usa "Long-stay discount")
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE descuentos_volumen
  ADD COLUMN IF NOT EXISTS nombre_en TEXT;
