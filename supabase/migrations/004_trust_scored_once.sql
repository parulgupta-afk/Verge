-- Fix: each report contributes to trust learning exactly once

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS trust_scored_at TIMESTAMPTZ;

COMMENT ON COLUMN reports.trust_scored_at IS
  'Set when refresh_reporter_trust has counted this report; prevents double-counting on cron';

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
      AND rep.created_at > NOW() - INTERVAL '30 days'
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

    UPDATE reports
    SET trust_scored_at = NOW()
    WHERE id = r.id;

    v_updated := v_updated + 1;
  END LOOP;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION refresh_reporter_trust IS
  'Scores each report once (trust_scored_at). Schedule via cron every few hours.';
