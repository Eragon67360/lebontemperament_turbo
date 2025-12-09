-- Add address and phone fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS home_phone TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT;

-- Grant SELECT permission on profiles table to all authenticated users
-- This allows all logged-in users to read the profiles table
GRANT SELECT ON profiles TO authenticated;

-- Create an index on email for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
