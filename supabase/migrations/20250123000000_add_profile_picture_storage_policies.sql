-- Create storage policies for profile-pictures bucket
-- This allows authenticated users to view profile pictures
-- and admins to upload, update, and delete them

-- Policy: Allow all authenticated users to SELECT (view) profile pictures
CREATE POLICY IF NOT EXISTS "Authenticated users can view profile pictures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures'
);

-- Policy: Allow admins to INSERT (upload) profile pictures
CREATE POLICY IF NOT EXISTS "Admins can upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Policy: Allow admins to UPDATE profile pictures
CREATE POLICY IF NOT EXISTS "Admins can update profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Policy: Allow admins to DELETE profile pictures
CREATE POLICY IF NOT EXISTS "Admins can delete profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);
