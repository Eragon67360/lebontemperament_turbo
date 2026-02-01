-- Allow authenticated users to read non-expired deliveries (e.g. when opening
-- the public track link while logged in). Token validation remains in the app.
CREATE POLICY "Authenticated can read non-expired deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (expires_at > NOW());
