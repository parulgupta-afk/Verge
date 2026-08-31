-- =============================================================================
-- VERGE: Complete Database Schema & Seed Data (One-Click Setup)
-- Copy and paste this whole script into your Supabase Dashboard -> SQL Editor
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  display_name TEXT DEFAULT 'anon',
  trust_weight REAL NOT NULL DEFAULT 1.0,
  reports_total INTEGER NOT NULL DEFAULT 0,
  reports_upheld INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROAD SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS road_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  road_code TEXT,
  city TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS road_segments_geometry_idx ON road_segments USING GIST (geometry);
CREATE INDEX IF NOT EXISTS road_segments_city_idx ON road_segments (city);
CREATE INDEX IF NOT EXISTS road_segments_status_idx ON road_segments (status);

-- 3. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES road_segments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('blocked', 'partial', 'clear')),
  media_url TEXT,
  media_verified BOOLEAN DEFAULT NULL,
  reporter_lat DOUBLE PRECISION,
  reporter_lng DOUBLE PRECISION,
  notes TEXT,
  trust_scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_segment_id_idx ON reports (segment_id);

-- 4. CONFIRMATIONS / REFUTATIONS TABLE
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES road_segments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  device_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('confirm', 'refute')),
  voter_lat DOUBLE PRECISION,
  voter_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS confirmations_segment_id_idx ON confirmations (segment_id);

DROP INDEX IF EXISTS confirmations_segment_user_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS confirmations_segment_user_uidx
  ON confirmations (segment_id, user_id)
  WHERE user_id IS NOT NULL;

DROP INDEX IF EXISTS confirmations_segment_device_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS confirmations_segment_device_uidx
  ON confirmations (segment_id, device_id)
  WHERE device_id IS NOT NULL AND user_id IS NULL;

-- 5. RATE LIMITS TABLE
CREATE TABLE IF NOT EXISTS action_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_key TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS action_rate_limits_actor_idx
  ON action_rate_limits (actor_key, action, created_at DESC);

-- 6. RPC: ensure_app_user
CREATE OR REPLACE FUNCTION ensure_app_user(p_auth_uid UUID, p_display TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM users WHERE auth_user_id = p_auth_uid;
  IF v_id IS NOT NULL THEN
    UPDATE users SET last_seen_at = NOW() WHERE id = v_id;
    RETURN v_id;
  END IF;
  INSERT INTO users (auth_user_id, display_name, trust_weight, last_seen_at)
  VALUES (p_auth_uid, COALESCE(p_display, 'anon'), 1.0, NOW())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 7. RPC: check_rate_limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_actor TEXT,
  p_action TEXT,
  p_max INT DEFAULT 20,
  p_window_minutes INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM action_rate_limits
  WHERE actor_key = p_actor
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  IF v_count >= p_max THEN
    RETURN FALSE;
  END IF;
  INSERT INTO action_rate_limits (actor_key, action) VALUES (p_actor, p_action);
  RETURN TRUE;
END;
$$;

-- 8. RPC: segment_distance_m
CREATE OR REPLACE FUNCTION segment_distance_m(
  p_segment_id UUID,
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
STABLE
AS $$
  SELECT ST_Distance(
    geometry,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  )
  FROM road_segments
  WHERE id = p_segment_id;
$$;

-- 9. RPC: segments_within_radius
CREATE OR REPLACE FUNCTION segments_within_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_m DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  status TEXT,
  confidence REAL,
  confirms INT,
  refutes INT,
  distance_m DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.name,
    s.city,
    s.status,
    s.confidence,
    s.confirms,
    s.refutes,
    ST_Distance(
      s.geometry,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM road_segments s
  WHERE ST_DWithin(
    s.geometry,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_radius_m
  )
  ORDER BY distance_m ASC;
$$;

-- 10. RPC: recalculate_segment_confidence
CREATE OR REPLACE FUNCTION recalculate_segment_confidence(p_segment_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_confirm_w REAL := 0;
  v_refute_w REAL := 0;
  v_confirm_n INT := 0;
  v_refute_n INT := 0;
  v_hours REAL;
  v_decay REAL;
  v_media_bonus REAL := 0;
  v_base REAL;
  v_confidence REAL;
  v_status TEXT;
  v_report_type TEXT;
  v_last_updated TIMESTAMPTZ;
BEGIN
  SELECT last_updated INTO v_last_updated
  FROM road_segments WHERE id = p_segment_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN c.type = 'confirm' THEN COALESCE(u.trust_weight, 1.0) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN c.type = 'refute' THEN COALESCE(u.trust_weight, 1.0) ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE c.type = 'confirm'),
    COUNT(*) FILTER (WHERE c.type = 'refute')
  INTO v_confirm_w, v_refute_w, v_confirm_n, v_refute_n
  FROM confirmations c
  LEFT JOIN users u ON u.id = c.user_id
  WHERE c.segment_id = p_segment_id;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM reports r
      WHERE r.segment_id = p_segment_id AND r.media_verified = TRUE
    ) THEN 0.08
    WHEN EXISTS (
      SELECT 1 FROM reports r
      WHERE r.segment_id = p_segment_id AND r.media_url IS NOT NULL
    ) THEN 0.03
    ELSE 0
  END INTO v_media_bonus;

  v_hours := EXTRACT(EPOCH FROM (NOW() - COALESCE(v_last_updated, NOW()))) / 3600.0;
  v_decay := GREATEST(0.0, 1.0 - (v_hours / 24.0));

  v_base := v_confirm_w / (v_confirm_w + v_refute_w + 1.0);
  v_confidence := LEAST(100.0, GREATEST(0.0, (v_base + v_media_bonus) * v_decay * 100.0));
  v_confidence := ROUND(v_confidence::numeric, 1);

  SELECT r.type INTO v_report_type
  FROM reports r
  LEFT JOIN users u ON u.id = r.reporter_id
  WHERE r.segment_id = p_segment_id
  ORDER BY COALESCE(u.trust_weight, 1.0) DESC, r.created_at DESC
  LIMIT 1;

  IF v_confirm_n = 0 AND v_refute_n = 0 AND v_report_type IS NULL THEN
    v_status := 'unknown';
  ELSIF v_report_type IS NOT NULL AND v_confidence >= 40 THEN
    v_status := v_report_type;
  ELSIF v_confidence >= 70 AND v_confirm_w > v_refute_w THEN
    v_status := COALESCE(v_report_type, 'blocked');
  ELSIF v_confidence >= 40 THEN
    v_status := COALESCE(v_report_type, 'partial');
  ELSIF v_refute_w > v_confirm_w THEN
    v_status := 'clear';
  ELSE
    v_status := COALESCE(v_report_type, 'unknown');
  END IF;

  UPDATE road_segments
  SET
    confirms = v_confirm_n,
    refutes = v_refute_n,
    confidence = v_confidence,
    status = v_status,
    last_updated = NOW()
  WHERE id = p_segment_id;
END;
$$;

-- 11. RPC: refresh_reporter_trust
CREATE OR REPLACE FUNCTION refresh_reporter_trust()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  v_aligned BOOLEAN;
  v_updated INT := 0;
BEGIN
  FOR r IN
    SELECT rep.id, rep.reporter_id, rep.type, s.status
    FROM reports rep
    JOIN road_segments s ON s.id = rep.segment_id
    WHERE rep.reporter_id IS NOT NULL
      AND rep.trust_scored_at IS NULL
      AND rep.created_at < NOW() - INTERVAL '2 hours'
      AND rep.created_at > NOW() - INTERVAL '7 days'
  LOOP
    v_aligned := (r.type = r.status)
      OR (r.type = 'partial' AND r.status IN ('partial', 'blocked'))
      OR (r.type = 'blocked' AND r.status = 'blocked');

    UPDATE users
    SET
      reports_total = reports_total + 1,
      reports_upheld = reports_upheld + CASE WHEN v_aligned THEN 1 ELSE 0 END,
      trust_weight = LEAST(
        2.5,
        GREATEST(
          0.3,
          0.5 + (
            (reports_upheld + CASE WHEN v_aligned THEN 1 ELSE 0 END)::REAL
            / NULLIF(reports_total + 1, 0)
          ) * 1.5
        )
      )
    WHERE id = r.reporter_id;

    UPDATE reports SET trust_scored_at = NOW() WHERE id = r.id;
    v_updated := v_updated + 1;
  END LOOP;
  RETURN v_updated;
END;
$$;

-- 12. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES FOR PUBLIC ANON ACCESS
ALTER TABLE road_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public road segments are viewable by everyone') THEN
    CREATE POLICY "Public road segments are viewable by everyone" ON road_segments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view reports') THEN
    CREATE POLICY "Anyone can view reports" ON reports FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert reports') THEN
    CREATE POLICY "Anyone can insert reports" ON reports FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view confirmations') THEN
    CREATE POLICY "Anyone can view confirmations" ON confirmations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert confirmations') THEN
    CREATE POLICY "Anyone can insert confirmations" ON confirmations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update confirmations') THEN
    CREATE POLICY "Anyone can update confirmations" ON confirmations FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view users') THEN
    CREATE POLICY "Users can view users" ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert users') THEN
    CREATE POLICY "Users can insert users" ON users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update users') THEN
    CREATE POLICY "Users can update users" ON users FOR UPDATE USING (true);
  END IF;
END $$;

-- 13. ENABLE REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE road_segments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- 14. SEED DATA (Delhi & Bangalore)
INSERT INTO road_segments (name, road_code, city, status, confidence, confirms, refutes, last_updated, metadata, geometry)
VALUES
  (
    'Outer Ring Road (South)',
    'ORR-S',
    'Delhi',
    'blocked',
    92,
    14,
    1,
    NOW(),
    '{"description": "Waterlogging near IIT Gate after heavy rain. Multiple lanes closed."}'::jsonb,
    ST_GeographyFromText('SRID=4326;LINESTRING(77.2000 28.5450, 77.2200 28.5450, 77.2400 28.5500, 77.2600 28.5550)')
  ),
  (
    'NH-48 (Gurgaon stretch)',
    'NH-48',
    'Delhi',
    'partial',
    71,
    8,
    3,
    NOW(),
    '{"description": "Slow traffic due to ongoing metro construction."}'::jsonb,
    ST_GeographyFromText('SRID=4326;LINESTRING(77.0700 28.4600, 77.0900 28.4700, 77.1100 28.4800, 77.1300 28.4900)')
  ),
  (
    'MG Road',
    'MG',
    'Delhi',
    'clear',
    88,
    19,
    0,
    NOW(),
    '{"description": "Traffic moving smoothly, no reported obstructions."}'::jsonb,
    ST_GeographyFromText('SRID=4326;LINESTRING(77.0800 28.4800, 77.1000 28.4850, 77.1200 28.4900)')
  ),
  (
    'Outer Ring Road (Bellandur)',
    'ORR-BLR',
    'Bangalore',
    'blocked',
    95,
    22,
    1,
    NOW(),
    '{"description": "Major waterlogging near EcoSpace flyover. Avoid corridor."}'::jsonb,
    ST_GeographyFromText('SRID=4326;LINESTRING(77.6750 12.9260, 77.6850 12.9300, 77.6950 12.9350)')
  ),
  (
    'Hosur Road (Silk Board)',
    'NH-44',
    'Bangalore',
    'partial',
    78,
    11,
    2,
    NOW(),
    '{"description": "Bottleneck at Silk Board junction. Expect 25 min delays."}'::jsonb,
    ST_GeographyFromText('SRID=4326;LINESTRING(77.6180 12.9170, 77.6250 12.9180, 77.6320 12.9200)')
  ),
  (
    'Old Airport Road',
    'OAR',
    'Bangalore',
    'clear',
    85,
    15,
    1,
    NOW(),
    '{"description": "Clear and fast-moving through Domlur and HAL."}'::jsonb,
    ST_GeographyFromText('SRID=4326;LINESTRING(77.6400 12.9600, 77.6600 12.9580, 77.6800 12.9550)')
  )
ON CONFLICT DO NOTHING;
