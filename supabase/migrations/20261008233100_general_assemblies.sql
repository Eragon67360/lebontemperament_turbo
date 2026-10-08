-- The general assembly (AG) page, prepared in the admin instead of a new
-- hard-coded page each year (plan /mnt/project-files/admin-content/
-- plan-2026-10-08.md, phase 2). The website's /ag shows the newest
-- published row; /ag-2026 redirects there (Thomas, 2026-10-08). The home
-- page announces it until the day of the AG.
--
-- Needs 20261008233000_site_documents.sql (documents, revisions).
-- Backward compatible: a new table only. The 2026 AG is seeded from the
-- page it replaces.
--
-- Rollback: DROP TABLE IF EXISTS public.general_assemblies;

CREATE TABLE IF NOT EXISTS public.general_assemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  held_at timestamptz NOT NULL,
  place text NOT NULL CHECK (length(btrim(place)) BETWEEN 1 AND 200),
  practical_note text CHECK (practical_note IS NULL OR length(practical_note) <= 500),
  -- Short Markdown, each shown under its heading when filled in.
  reminders text CHECK (reminders IS NULL OR length(reminders) <= 3000),
  voting_rights text CHECK (voting_rights IS NULL OR length(voting_rights) <= 3000),
  agenda text CHECK (agenda IS NULL OR length(agenda) <= 3000),
  afterwards text CHECK (afterwards IS NULL OR length(afterwards) <= 3000),
  convocation_document_id uuid REFERENCES public.site_documents (id) ON DELETE SET NULL,
  proxy_document_id uuid REFERENCES public.site_documents (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.general_assemblies IS
  'General assemblies shown at /ag (newest published one) and announced on the home page until their day. Edited in the admin (Association › Assemblée générale).';

CREATE INDEX IF NOT EXISTS general_assemblies_held_at_idx
  ON public.general_assemblies (status, held_at DESC);

ALTER TABLE public.general_assemblies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "General assemblies: everyone reads published" ON public.general_assemblies;
CREATE POLICY "General assemblies: everyone reads published"
  ON public.general_assemblies FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "General assemblies: admins read all" ON public.general_assemblies;
CREATE POLICY "General assemblies: admins read all"
  ON public.general_assemblies FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "General assemblies: admins add" ON public.general_assemblies;
CREATE POLICY "General assemblies: admins add"
  ON public.general_assemblies FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "General assemblies: admins edit" ON public.general_assemblies;
CREATE POLICY "General assemblies: admins edit"
  ON public.general_assemblies FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "General assemblies: superadmins delete" ON public.general_assemblies;
CREATE POLICY "General assemblies: superadmins delete"
  ON public.general_assemblies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'superadmin'
    )
  );

REVOKE ALL ON TABLE public.general_assemblies FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.general_assemblies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.general_assemblies TO authenticated;
GRANT ALL ON TABLE public.general_assemblies TO service_role;

DROP TRIGGER IF EXISTS general_assemblies_updated_at ON public.general_assemblies;
CREATE TRIGGER general_assemblies_updated_at
  BEFORE UPDATE ON public.general_assemblies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS general_assemblies_revision ON public.general_assemblies;
CREATE TRIGGER general_assemblies_revision
  AFTER UPDATE OR DELETE ON public.general_assemblies
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();

-- The 2026 AG, from app/ag-2026/page.tsx.
INSERT INTO public.general_assemblies
  (held_at, place, practical_note, reminders, voting_rights, agenda, afterwards,
   convocation_document_id, proxy_document_id, status)
SELECT
  '2026-03-14 19:00:00+01'::timestamptz,
  'Freihof, Wangen',
  'Le parking se fera devant la salle des fêtes.',
  E'- Si vous ne pouvez pas être présent, il est **impératif** de donner une procuration pour que cette AG statutaire puisse se tenir valablement.\n- Un membre ne peut avoir que **deux procurations maximum**.\n- L''an dernier, l''AG a failli être annulée car il manquait une voix. Chaque procuration compte !',
  'Ont le droit de vote tous les membres de plus de 16 ans à la date de l''AG, à jour de leurs cotisations pour l''année 2025, et membres depuis plus de 6 mois. Afin que les votes soient recevables, le CA rappelle l''importance que toutes les personnes répondant à ces critères et ne pouvant être présentes se fassent représenter par un membre présent à l''aide d''une procuration.',
  'Lors de cette AG, nous procéderons à l''élection du nouveau CA. C''est l''occasion de rejoindre cette instance qui gère l''association tout au long de l''année.',
  'Cette AG sera suivie d''un apéritif dînatoire partagé amené par vos soins. La boisson sera fournie par l''association. **Apportez vos verres.**',
  (SELECT id FROM public.site_documents WHERE storage_key = 'pdf/AG_2026/convocation_AG_2026.pdf'),
  (SELECT id FROM public.site_documents WHERE storage_key = 'pdf/AG_2026/procuration_AG_2026.pdf'),
  'published'
WHERE NOT EXISTS (
  SELECT 1 FROM public.general_assemblies WHERE held_at = '2026-03-14 19:00:00+01'::timestamptz
);
