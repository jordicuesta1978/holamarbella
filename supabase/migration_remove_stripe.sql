-- Elimina Stripe: la plataforma ya no gestiona pagos online, solo transferencia/Revolut
-- registrados a mano por Mar en deposit_paid.
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE reservas
  DROP COLUMN IF EXISTS stripe_session_id,
  DROP COLUMN IF EXISTS paid_at;
