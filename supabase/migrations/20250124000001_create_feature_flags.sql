-- Create feature_flags table to manage feature toggles
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key TEXT NOT NULL UNIQUE,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on flag_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_key ON feature_flags(flag_key);

-- Enable RLS on feature_flags table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read feature flags (required for public website)
-- This single policy covers both direct reads and realtime subscriptions
CREATE POLICY "Allow anonymous access"
  ON feature_flags
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow authenticated users to read feature flags
CREATE POLICY "Allow authenticated access"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only superadmins can update feature flags
CREATE POLICY "Superadmins can update feature flags"
  ON feature_flags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Policy: Only superadmins can insert feature flags
CREATE POLICY "Superadmins can insert feature flags"
  ON feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Policy: Only superadmins can delete feature flags
CREATE POLICY "Superadmins can delete feature flags"
  ON feature_flags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the anniversary feature flag
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled)
VALUES (
  'anniversary_40_years',
  '40 ans - Page anniversaire',
  'Active ou désactive la page anniversaire des 40 ans et tous les éléments associés (navigation, bubble, etc.)',
  false
)
ON CONFLICT (flag_key) DO NOTHING;

-- Grant SELECT permission (required for realtime and direct access)
GRANT SELECT ON feature_flags TO anon;
GRANT SELECT ON feature_flags TO authenticated;

-- Ensure the table can be accessed via realtime by setting replica identity
-- This is required for realtime to send old/new values in UPDATE events
ALTER TABLE feature_flags REPLICA IDENTITY FULL;

-- Enable realtime for feature_flags table
-- This adds the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE feature_flags;
