-- ============================================================
-- HolaMarbella — Migración: registro de viajeros (RD 933/2021)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================
-- Una fila por viajero registrado. Inserción pública (desde el formulario);
-- lectura solo desde el backend (service_role) para el panel admin.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS registros_viajeros (
  id               BIGSERIAL PRIMARY KEY,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  apartment_slug   TEXT REFERENCES apartments(slug) ON DELETE SET NULL,

  -- Datos personales
  nombre           TEXT NOT NULL,
  apellidos        TEXT NOT NULL,
  sexo             TEXT,                 -- 'M' | 'F'
  tipo_documento   TEXT NOT NULL,        -- 'DNI' | 'Pasaporte' | 'TIE'
  numero_documento TEXT NOT NULL,
  numero_soporte   TEXT,                 -- solo si tipo_documento = 'DNI'
  nacionalidad     TEXT,
  fecha_nacimiento DATE,

  -- Residencia habitual
  direccion        TEXT,
  localidad        TEXT,
  codigo_postal    TEXT,
  pais             TEXT,

  -- Contacto
  telefono_movil   TEXT NOT NULL,
  telefono_fijo    TEXT,
  email            TEXT,

  -- Estancia
  num_viajeros     INT,
  parentesco       TEXT                  -- obligatorio si el viajero es menor
);

ALTER TABLE registros_viajeros ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar su registro; nadie puede leer desde el cliente.
DROP POLICY IF EXISTS "registros_insert" ON registros_viajeros;
CREATE POLICY "registros_insert" ON registros_viajeros
  FOR INSERT WITH CHECK (true);
