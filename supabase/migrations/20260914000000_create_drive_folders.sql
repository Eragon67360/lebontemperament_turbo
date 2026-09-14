-- Google Drive folders shown on /membres/travail.
-- The IDs used to live in NEXT_PUBLIC_GDRIVE_* env vars (plus hardcoded
-- fallbacks), so retargeting a folder meant a redeploy.
CREATE TABLE IF NOT EXISTS public.drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;

-- Members read the folders to browse them; /membres is behind auth anyway.
CREATE POLICY "Allow authenticated read access to drive folders"
  ON public.drive_folders
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/DELETE policies: the set of folders is fixed, admins only retarget
-- an existing one.
CREATE POLICY "Allow admin/superadmin to update drive folders"
  ON public.drive_folders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE INDEX idx_drive_folders_order ON public.drive_folders(display_order);

CREATE TRIGGER update_drive_folders_updated_at
  BEFORE UPDATE ON public.drive_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Current production values, previously hardcoded in the website.
INSERT INTO public.drive_folders (slug, label, folder_id, display_order) VALUES
  ('racine', 'Drive complet', '1oQGEse5USfg9KhM7dZv7_w6olmk_slaU', 0),
  ('adultes', 'Adultes', '19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd', 1),
  ('jeunes', 'Jeunes', '18ZukzBIhWotJ9UxpUTdodGBSY1wf0Q81', 2),
  ('enfants', 'Enfants', '1Jcn6pSKBHpOvFXp5j0h6kKcwOBrAIkId', 3),
  ('orchestre', 'Orchestre', '1t72TgfhowS2WqYDFYLkasqopdUI_FEem', 4),
  ('cahier-30-ans', 'Cahier 30 ans', '1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB', 5)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.drive_folders IS 'Google Drive folders browsed from the members area; slug "racine" is the direct Drive link.';
