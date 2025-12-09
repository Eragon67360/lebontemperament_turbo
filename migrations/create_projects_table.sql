-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sub_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  image TEXT, -- Cloudinary path or URL
  explanation TEXT,
  banniere TEXT, -- Cloudinary path
  banniere_photographer_name TEXT,
  banniere_photographer_url TEXT,
  image2 TEXT, -- Cloudinary path
  image2_photographer_name TEXT,
  image2_photographer_url TEXT,
  image3 TEXT, -- Cloudinary path
  image3_photographer_name TEXT,
  image3_photographer_url TEXT,
  text1 TEXT,
  text2 TEXT,
  author_name TEXT,
  press_articles JSONB, -- Array of {title, url, source}
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_date ON projects(date);
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can SELECT (read) projects
CREATE POLICY "Anyone can view projects"
  ON projects
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users with admin or superadmin role can INSERT
CREATE POLICY "Admins can create projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])))
    )
  );

-- Policy: Only authenticated users with admin or superadmin role can UPDATE
CREATE POLICY "Admins can update projects"
  ON projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])))
    )
  );

-- Policy: Only authenticated users with admin or superadmin role can DELETE
CREATE POLICY "Admins can delete projects"
  ON projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])))
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
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
