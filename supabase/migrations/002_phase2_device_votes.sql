-- Phase 2: optional device-scoped votes (before full auth)
-- Safe to run after 001_initial_schema.sql

ALTER TABLE confirmations
  ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS confirmations_segment_device_uidx
  ON confirmations (segment_id, device_id)
  WHERE device_id IS NOT NULL;

COMMENT ON COLUMN confirmations.device_id IS 'Anonymous device id until Supabase Auth is enabled';
