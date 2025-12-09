-- Add profile_picture_url field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL of the profile picture stored in Supabase storage bucket profile-picture';
