-- =============================================================================
-- Verge migration 003: Reporter trust, vote integrity, report-type-aware status
-- Source of truth for confidence = this Postgres function (NOT the Hono toy API)
-- =============================================================================

-- Extend users for trust learning
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reports_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_upheld INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Link app users row to Supabase Auth uid (anonymous or email)
COMMENT ON COLUMN users.auth_user_id IS 'Supabase auth.users.id from anonymous or real login';
COMMENT ON COLUMN users.trust_weight IS 'Multiplicative weight in confidence; starts 1.0, adjusted by upheld rate';

-- Confirmations: ensure user_id + optional location at vote time
ALTER TABLE confirmations
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS voter_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS voter_lng DOUBLE PRECISION;

-- One vote per auth user per segment (preferred)
DROP INDEX IF EXISTS confirmations_segment_user_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS confirmations_segment_user_uidx
  ON confirmations (segment_id, user_id)
  WHERE user_id IS NOT NULL;

-- Keep device fallback unique when no user yet
CREATE UNIQUE INDEX IF NOT EXISTS confirmations_segment_device_uidx
  ON confirmations (segment_id, device_id)
  WHERE device_id IS NOT NULL AND user_id IS NULL;

-- Reports: optional geo at report time
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS reporter_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS reporter_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS media_verified BOOLEAN DEFAULT NULL;
  -- NULL = not checked; true/false = vision/heuristic result

-- Rate-limit log (simple)
CREATE TABLE IF NOT EXISTS action_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_key TEXT NOT NULL,          -- user_id or device_id
  action TEXT NOT NULL,             -- 'vote' | 'report'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS action_rate_limits_actor_idx
  ON action_rate_limits (actor_key, action, created_at DESC);

-- Ensure public.users row exists for an auth uid (call after signInAnonymously)
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

-- Rate limit: max N actions per window
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

-- Distance helper (meters) between point and segment geography
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

-- =============================================================================
-- SOURCE OF TRUTH: trust-weighted + report-type-aware confidence
-- =============================================================================
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

  -- Weighted confirms / refutes (trust_weight from users; default 1.0 if no user)
  SELECT
    COALESCE(SUM(CASE WHEN c.type = 'confirm' THEN COALESCE(u.trust_weight, 1.0) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN c.type = 'refute' THEN COALESCE(u.trust_weight, 1.0) ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE c.type = 'confirm'),
    COUNT(*) FILTER (WHERE c.type = 'refute')
  INTO v_confirm_w, v_refute_w, v_confirm_n, v_refute_n
  FROM confirmations c
  LEFT JOIN users u ON u.id = c.user_id
  WHERE c.segment_id = p_segment_id;

  -- Media: any report with media_url gets small bonus; verified media gets more
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM reports r
      WHERE r.segment_id = p_segment_id AND r.media_verified = TRUE
    ) THEN 0.08
    WHEN EXISTS (
      SELECT 1 FROM reports r
      WHERE r.segment_id = p_segment_id AND r.media_url IS NOT NULL
    ) THEN 0.03  -- flat "file attached" only — NOT content verification
    ELSE 0
  END INTO v_media_bonus;

  v_hours := EXTRACT(EPOCH FROM (NOW() - COALESCE(v_last_updated, NOW()))) / 3600.0;
  v_decay := GREATEST(0.0, 1.0 - (v_hours / 24.0));

  v_base := v_confirm_w / (v_confirm_w + v_refute_w + 1.0);
  v_confidence := LEAST(100.0, GREATEST(0.0, (v_base + v_media_bonus) * v_decay * 100.0));
  v_confidence := ROUND(v_confidence::numeric, 1);

  -- Report-type-aware status: prefer latest report from higher-trust reporters
  SELECT r.type INTO v_report_type
  FROM reports r
  LEFT JOIN users u ON u.id = r.reporter_id
  WHERE r.segment_id = p_segment_id
  ORDER BY COALESCE(u.trust_weight, 1.0) DESC, r.created_at DESC
  LIMIT 1;

  IF v_confirm_n = 0 AND v_refute_n = 0 AND v_report_type IS NULL THEN
    v_status := 'unknown';
  ELSIF v_report_type IS NOT NULL AND v_confidence >= 40 THEN
    -- Status follows what was actually reported, once we have meaningful signal
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

COMMENT ON FUNCTION recalculate_segment_confidence IS
  'Source of truth: trust-weighted votes + report-type-aware status + mild media bonus (attach vs verified)';

-- Trust learning job: compare recent reports to current segment status
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

    v_updated := v_updated + 1;
  END LOOP;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION refresh_reporter_trust IS
  'Call on a schedule (Edge cron every few hours) to update trust_weight from report outcomes';
