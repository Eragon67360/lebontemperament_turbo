-- Announcements managed in the admin (plan /mnt/project-files/admin-content/
-- plan-2026-10-08.md, phase 3): the buttons under the home page's title
-- (they replace the hard-coded « Calendrier musical » call to action) and the
-- donation campaign card that opens once from the heart in the navigation.
-- Each shows between its optional start and end days (Paris), when published.
--
-- Needs 20261008233000_site_documents.sql (content_revisions).
-- Backward compatible: a new table only. Seeds the donation campaign card the
-- website shows today, so visitors who already saw it don't see it again.
--
-- Rollback: DROP TABLE IF EXISTS public.site_announcements;

CREATE TABLE IF NOT EXISTS public.site_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL CHECK (placement IN ('home', 'donation_popover')),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 80),
  body text CHECK (body IS NULL OR length(body) <= 300),
  link_label text CHECK (link_label IS NULL OR length(btrim(link_label)) BETWEEN 1 AND 40),
  -- A path on the website (/don) or an https address.
  link_url text NOT NULL CHECK (
    length(link_url) <= 500
    AND (link_url ~ '^/([^/]|$)' OR link_url ~ '^https://[^\s]+$')
  ),
  starts_on date,
  ends_on date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_on IS NULL OR ends_on IS NULL OR starts_on <= ends_on)
);

COMMENT ON TABLE public.site_announcements IS
  'Announcements on the website (home buttons, donation campaign card), edited in the admin (Site public › Annonces). Shown when published and within starts_on..ends_on (Paris days).';

CREATE INDEX IF NOT EXISTS site_announcements_placement_idx
  ON public.site_announcements (placement, status);

ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site announcements: everyone reads published" ON public.site_announcements;
CREATE POLICY "Site announcements: everyone reads published"
  ON public.site_announcements FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Site announcements: admins read all" ON public.site_announcements;
CREATE POLICY "Site announcements: admins read all"
  ON public.site_announcements FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Site announcements: admins add" ON public.site_announcements;
CREATE POLICY "Site announcements: admins add"
  ON public.site_announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Site announcements: admins edit" ON public.site_announcements;
CREATE POLICY "Site announcements: admins edit"
  ON public.site_announcements FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Site announcements: superadmins delete" ON public.site_announcements;
CREATE POLICY "Site announcements: superadmins delete"
  ON public.site_announcements FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'superadmin'
    )
  );

REVOKE ALL ON TABLE public.site_announcements FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.site_announcements TO authenticated;
GRANT ALL ON TABLE public.site_announcements TO service_role;

DROP TRIGGER IF EXISTS site_announcements_updated_at ON public.site_announcements;
CREATE TRIGGER site_announcements_updated_at
  BEFORE UPDATE ON public.site_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS site_announcements_revision ON public.site_announcements;
CREATE TRIGGER site_announcements_revision
  AFTER UPDATE OR DELETE ON public.site_announcements
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();

-- The donation campaign card shown today (DonationCampaignShowcase.tsx). Its
-- fixed id keeps the « already seen » key visitors' browsers hold.
INSERT INTO public.site_announcements
  (id, placement, title, body, link_label, link_url, status)
VALUES (
  '5d6f0b0e-2a43-4c1b-9b7e-0c1a2d3e4f50',
  'donation_popover',
  'Nouvelle campagne de dons',
  'Notre nouvelle campagne est ouverte. Découvrez à quoi peut servir chaque don — avec quelques coulisses du BT.',
  'Découvrir',
  '/don',
  'published'
)
ON CONFLICT (id) DO NOTHING;
