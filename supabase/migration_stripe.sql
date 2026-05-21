-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/kftyemxltrzxafzpyafh/sql)

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
