-- ============================================================
-- HolaMarbella — Migración sistema de mensajería
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Token único de conversación en cada reserva
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS conversation_token UUID DEFAULT gen_random_uuid();

UPDATE reservas SET conversation_token = gen_random_uuid() WHERE conversation_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reservas_conversation_token_idx
  ON reservas(conversation_token);

-- 2. Tabla de chat gestor ↔ huésped
CREATE TABLE IF NOT EXISTS mensajes_chat (
  id              BIGSERIAL PRIMARY KEY,
  reserva_id      BIGINT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL CHECK (sender IN ('guest', 'admin')),
  texto           TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'text' CHECK (tipo IN ('text', 'payment_request')),
  payment_amount  INTEGER,
  leido           BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mensajes_chat_reserva_idx
  ON mensajes_chat(reserva_id, created_at);

CREATE INDEX IF NOT EXISTS mensajes_chat_unread_idx
  ON mensajes_chat(leido, sender) WHERE leido = false;

ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;
-- Todas las operaciones van por server actions con service role (bypass RLS)
