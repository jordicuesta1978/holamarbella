-- Añade traducción del modal de amenidades a apartment_translations.
-- La fila ya tiene columna `locale`, así que el nombre es genérico.
ALTER TABLE apartment_translations ADD COLUMN IF NOT EXISTS amenity_categories JSONB;
