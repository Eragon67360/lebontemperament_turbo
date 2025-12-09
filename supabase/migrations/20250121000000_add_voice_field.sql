-- Add voice field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS voice TEXT;
