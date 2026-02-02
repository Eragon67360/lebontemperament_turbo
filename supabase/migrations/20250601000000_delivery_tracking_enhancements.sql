-- Migration: Delivery Tracking Enhancements
-- Description: Add scheduled time, delay, problem message to deliveries;
--              add delivery_recipients table for personalized recipient times.

-- ============================================================================
-- ALTER TABLE: deliveries (new columns)
-- ============================================================================
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delay_minutes INT NULL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS problem_message TEXT NULL;

-- ============================================================================
-- TABLE: delivery_recipients
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_delivery_recipients_delivery_id ON delivery_recipients(delivery_id);

-- Enable RLS
ALTER TABLE delivery_recipients ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can manage all delivery_recipients
CREATE POLICY "Superadmins can manage all delivery_recipients"
  ON delivery_recipients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Policy: Clients can read recipients for non-expired deliveries
CREATE POLICY "Clients can read non-expired delivery_recipients"
  ON delivery_recipients
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = delivery_recipients.delivery_id
      AND d.expires_at > NOW()
    )
  );

-- Policy: Authenticated can read recipients for non-expired deliveries
CREATE POLICY "Authenticated can read non-expired delivery_recipients"
  ON delivery_recipients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = delivery_recipients.delivery_id
      AND d.expires_at > NOW()
    )
  );

GRANT SELECT ON delivery_recipients TO anon;
GRANT SELECT ON delivery_recipients TO authenticated;

-- ============================================================================
-- UPDATE get_delivery_by_token (include new columns)
-- Must DROP first because return type (OUT parameters) is changing.
-- ============================================================================
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
    d.is_delayed,
    d.delay_minutes,
    d.problem_message
  FROM deliveries d
  WHERE d.public_token = token
    AND d.expires_at > NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION get_delivery_by_token(TEXT) TO anon;

-- ============================================================================
-- REALTIME: delivery_recipients
-- ============================================================================
ALTER TABLE delivery_recipients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_recipients;
