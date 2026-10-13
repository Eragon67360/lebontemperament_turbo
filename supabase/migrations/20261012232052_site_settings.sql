-- Site settings managed in the admin (#621, plan phase 5): contact, social
-- links, donations, joining facts, legal notice. One row per key; the value's
-- shape is checked by @repo/domain/utils/siteSettings (admin routes and
-- website). A missing row means « today's value », kept in code, so nothing
-- is seeded. Only superadmins change `contact` (the mailbox receives the
-- contact forms and personal-data requests). Needs content_revisions
-- (20261008233000_site_documents.sql).
-- Rollback: DROP TABLE IF EXISTS public.site_settings;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (
    key IN ('contact', 'social_links', 'donations', 'joining', 'legal_notice')
  ),
  value jsonb NOT NULL CHECK (
    jsonb_typeof(value) = 'object' AND pg_column_size(value) <= 32768
  ),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings: everyone reads" ON public.site_settings;
CREATE POLICY "Site settings: everyone reads"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Site settings: admins add" ON public.site_settings;
CREATE POLICY "Site settings: admins add"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() AND (key <> 'contact' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'superadmin'
    ))
  );

DROP POLICY IF EXISTS "Site settings: admins edit" ON public.site_settings;
CREATE POLICY "Site settings: admins edit"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (
    public.is_admin() AND (key <> 'contact' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'superadmin'
    ))
  )
  WITH CHECK (
    public.is_admin() AND (key <> 'contact' OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'superadmin'
    ))
  );

-- No DELETE: a setting goes back to its default by saving the default.
REVOKE ALL ON TABLE public.site_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.site_settings TO authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS site_settings_revision ON public.site_settings;
CREATE TRIGGER site_settings_revision
  AFTER UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();
