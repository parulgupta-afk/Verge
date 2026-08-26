-- Verge Phase 1: Initial schema (India-focused)
-- Requires PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (lightweight for MVP)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT,
  trust_weight REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Road segments (real geometry)
CREATE TABLE IF NOT EXISTS road_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  road_code TEXT,
  city TEXT NOT NULL,                    -- e.g. 'Delhi', 'Bangalore'
  geometry geography(LineString, 4326) NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('blocked', 'partial', 'clear', 'unknown')),
  confidence REAL NOT NULL DEFAULT 0
    CHECK (confidence >= 0 AND confidence <= 100),
  confirms INTEGER NOT NULL DEFAULT 0,
  refutes INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for fast viewport / proximity queries
CREATE INDEX IF NOT EXISTS road_segments_geometry_idx
  ON road_segments USING GIST (geometry);

CREATE INDEX IF NOT EXISTS road_segments_city_idx ON road_segments (city);
CREATE INDEX IF NOT EXISTS road_segments_status_idx ON road_segments (status);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES road_segments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('blocked', 'partial', 'clear')),
  media_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_segment_id_idx ON reports (segment_id);

-- Confirmations / Refutations
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES road_segments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('confirm', 'refute')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (segment_id, user_id)          -- one vote per user per segment
);

CREATE INDEX IF NOT EXISTS confirmations_segment_id_idx ON confirmations (segment_id);

-- Simple function to recalculate confidence (MVP version)
CREATE OR REPLACE FUNCTION recalculate_segment_confidence(p_segment_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_confirms INTEGER;
  v_refutes INTEGER;
  v_last_updated TIMESTAMPTZ;
  v_hours_since REAL;
  v_base REAL;
  v_decay REAL;
  v_confidence REAL;
  v_status TEXT;
BEGIN
  SELECT confirms, refutes, last_updated
  INTO v_confirms, v_refutes, v_last_updated
  FROM road_segments
  WHERE id = p_segment_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Count from confirmations table for accuracy
  SELECT
    COUNT(*) FILTER (WHERE type = 'confirm'),
    COUNT(*) FILTER (WHERE type = 'refute')
  INTO v_confirms, v_refutes
  FROM confirmations
  WHERE segment_id = p_segment_id;

  v_hours_since := EXTRACT(EPOCH FROM (NOW() - v_last_updated)) / 3600.0;
  v_decay := GREATEST(0.0, 1.0 - (v_hours_since / 24.0));  -- decay over 24h

  v_base := (v_confirms::REAL) / (v_confirms + v_refutes + 1.0);
  v_confidence := LEAST(100.0, GREATEST(0.0, v_base * v_decay * 100.0));

  -- Derive status from confidence + majority
  IF v_confidence >= 70 AND v_confirms > v_refutes THEN
    v_status := 'blocked';  -- will be refined by report type later
  ELSIF v_confidence >= 40 THEN
    v_status := 'partial';
  ELSIF v_confirms = 0 AND v_refutes = 0 THEN
    v_status := 'unknown';
  ELSE
    v_status := 'clear';
  END IF;

  UPDATE road_segments
  SET
    confirms = v_confirms,
    refutes = v_refutes,
    confidence = ROUND(v_confidence::numeric, 1),
    status = v_status,
    last_updated = NOW()
  WHERE id = p_segment_id;
END;
$$;

-- Trigger to keep counts in sync (optional helper)
COMMENT ON TABLE road_segments IS 'India-focused road segments with PostGIS geometry and live confidence';
COMMENT ON FUNCTION recalculate_segment_confidence IS 'MVP confidence: confirms vs refutes with 24h linear decay';
