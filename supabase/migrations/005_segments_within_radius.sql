-- =============================================================================
-- Verge migration 005: proximity query backing GET /api/segments/nearby
-- =============================================================================

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

COMMENT ON FUNCTION segments_within_radius IS
  'Returns road segments within p_radius_m meters of a point, nearest first. Backs GET /api/segments/nearby.';
