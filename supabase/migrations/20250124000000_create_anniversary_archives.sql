-- Migration: Anniversary Archives Table
-- Description: Create table for storing archive documents (AG reports, annual reports, etc.)

-- ============================================================================
-- TABLE: anniversary_archives
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'assemblée-générale',
    'rapport-annuel',
    'rapport-financier',
    'gazette',
    'programme',
    'document-historique'
  )),
  theme TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anniversary_archives_year ON anniversary_archives(year);
CREATE INDEX IF NOT EXISTS idx_anniversary_archives_type ON anniversary_archives(type);
CREATE INDEX IF NOT EXISTS idx_anniversary_archives_theme ON anniversary_archives(theme);
CREATE INDEX IF NOT EXISTS idx_anniversary_archives_visible ON anniversary_archives(is_visible);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_anniversary_archives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anniversary_archives_updated_at
  BEFORE UPDATE ON anniversary_archives
  FOR EACH ROW
  EXECUTE FUNCTION update_anniversary_archives_updated_at();

-- Enable RLS
ALTER TABLE anniversary_archives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Allow public read on visible archives
CREATE POLICY "Allow public read on anniversary_archives"
  ON anniversary_archives FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

-- Policy: Allow admin full access (read all, write all)
CREATE POLICY "Allow admin write on anniversary_archives"
  ON anniversary_archives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
