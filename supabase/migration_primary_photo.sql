-- Añadir columna primary_photo a la tabla apartments
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS primary_photo TEXT;

-- Comentario: almacena la ruta a la foto principal (ej: 'paloma/foto.jpg')
-- o un JSON array de rutas ordenadas (ej: '["paloma/foto1.jpg","paloma/foto2.jpg"]')
-- donde el primer elemento es siempre la foto principal.
