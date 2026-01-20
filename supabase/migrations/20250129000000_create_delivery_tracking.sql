-- Migration: Delivery Tracking Table
-- Description: Create table for real-time delivery tracking with driver and client access

-- ============================================================================
-- TABLE: deliveries (Delivery Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  public_token TEXT NOT NULL UNIQUE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_tracking_active BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_public_token ON deliveries(public_token);
CREATE INDEX IF NOT EXISTS idx_deliveries_expires_at ON deliveries(expires_at);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Superadmins can read, update, and insert all deliveries
CREATE POLICY "Superadmins can manage all deliveries"
  ON deliveries
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

-- Policy: Anonymous users can read non-expired deliveries
-- Note: The application layer will validate the public_token before allowing access.
-- This policy ensures expired deliveries cannot be accessed, but token validation
-- happens in the application code before subscribing to realtime updates.
CREATE POLICY "Clients can read non-expired deliveries"
  ON deliveries
  FOR SELECT
  TO anon
  USING (expires_at > NOW());

-- Grant SELECT permission to anonymous users (required for realtime)
GRANT SELECT ON deliveries TO anon;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to validate delivery token (for application use)
CREATE OR REPLACE FUNCTION get_delivery_by_token(token TEXT)
RETURNS TABLE (
  id UUID,
  driver_id UUID,
  public_token TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_tracking_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    d.updated_at
  FROM deliveries d
  WHERE d.public_token = token
    AND d.expires_at > NOW();
END;
$$;

-- Grant execute permission on the function to anonymous users
GRANT EXECUTE ON FUNCTION get_delivery_by_token(TEXT) TO anon;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_deliveries_updated_at();

-- ============================================================================
-- REALTIME CONFIGURATION
-- ============================================================================

-- Set replica identity to FULL (required for realtime to send old/new values)
ALTER TABLE deliveries REPLICA IDENTITY FULL;

-- Enable realtime for deliveries table
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
