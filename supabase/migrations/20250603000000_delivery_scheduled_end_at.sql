-- Migration: Global delivery time range (scheduled_end_at)
-- Description: Add scheduled_end_at to deliveries so driver can set a time range (e.g. 14h–18h).

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMPTZ NULL;

-- Update get_delivery_by_token to return scheduled_end_at (DROP first because return type changes)
DROP FUNCTION IF EXISTS get_delivery_by_token(TEXT);

CREATE FUNCTION get_delivery_by_token(token TEXT)
RETURNS TABLE (
  id UUID,
  driver_id UUID,
  public_token TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_tracking_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  is_delayed BOOLEAN,
  delay_minutes INT,
  problem_message TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.driver_id,
    d.public_token,
    d.latitude,
    d.longitude,
    d.is_tracking_active,
    d.expires_at,
    d.created_at,
    d.updated_at,
    d.scheduled_at,
    d.scheduled_end_at,
    d.is_delayed,
    d.delay_minutes,
    d.problem_message
  FROM deliveries d
  WHERE d.public_token = token
    AND d.expires_at > NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION get_delivery_by_token(TEXT) TO anon;
