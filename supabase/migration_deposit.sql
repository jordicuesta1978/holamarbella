-- Añadir campo de pago a cuenta (depósito) a la tabla reservas
-- El pago se gestiona por fuera de la plataforma (transferencia, etc.)
-- y Mar lo registra manualmente antes de aprobar la reserva.
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS deposit_paid INTEGER NOT NULL DEFAULT 0;
