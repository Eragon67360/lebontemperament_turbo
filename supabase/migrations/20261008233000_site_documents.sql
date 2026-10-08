-- Documents de l'association managed from the admin
-- (plan: /mnt/project-files/admin-content/plan-2026-10-08.md, decisions of 2026-10-08).
--
-- 1. content_revisions: the previous version of every edited or deleted
--    content row, written by a trigger, so an admin can restore it.
-- 2. document_collections: the archive sections (AG, Gazettes, Pêle-Mêle…);
--    admins can add one, a collection that still holds documents can't be
--    removed (ON DELETE RESTRICT).
-- 3. site_documents: one row per PDF in the `site-media` bucket. Rows are
--    read by the website and the app (anyone reads published public rows,
--    signed-in members also read members-only rows, admins read everything);
--    admins add and edit, only superadmins delete for good (« Archiver » is
--    the admins' delete).
-- 4. site_document_object(): resolves /documents/<collection>/<file> on the
--    website. Published documents stay openable by link whatever their
--    visibility, as the files in public/ always were (Thomas, 2026-10-08).
-- 5. The `site-media` bucket (created on production by scripts/media for
--    #344; created here when missing, as on staging) and the storage
--    policies letting admins upload under documents/.
-- 6. The existing PDFs (#344 manifest) as rows.
--
-- Backward compatible: only new objects. Installed apps keep their own list
-- and the /pdf/... links, which keep working.
--
-- Rollback (nothing else depends on these objects yet):
--   DROP FUNCTION IF EXISTS public.site_document_object(text, text);
--   DROP TABLE IF EXISTS public.site_documents;
--   DROP TABLE IF EXISTS public.document_collections;
--   DROP TABLE IF EXISTS public.content_revisions;
--   DROP FUNCTION IF EXISTS public.record_content_revision();
--   DROP POLICY "Site media: admins read documents" ON storage.objects;
--   DROP POLICY "Site media: admins upload documents" ON storage.objects;
--   DROP POLICY "Site media: admins replace documents" ON storage.objects;
--   DROP POLICY "Site media: superadmins delete documents" ON storage.objects;

-- 1. History ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  row_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('UPDATE', 'DELETE')),
  old_row jsonb NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.content_revisions IS
  'Previous versions of admin-managed content rows (site_documents, …), written by record_content_revision(). changed_by is the auth user id, kept without a foreign key so deleting an account never touches the history.';

CREATE INDEX IF NOT EXISTS content_revisions_row_idx
  ON public.content_revisions (table_name, row_id, changed_at DESC);

ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Content revisions: admins read" ON public.content_revisions;
CREATE POLICY "Content revisions: admins read"
  ON public.content_revisions FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.content_revisions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.content_revisions TO authenticated;
GRANT ALL ON TABLE public.content_revisions TO service_role;

CREATE OR REPLACE FUNCTION public.record_content_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_revisions (table_name, row_id, operation, old_row, changed_by)
  VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.record_content_revision() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_content_revision() TO service_role;

-- 2. Collections ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 40),
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 80),
  description text CHECK (description IS NULL OR length(description) <= 300),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.document_collections IS
  'Sections of « Documents de l''association » (admin) and of the members area''s archives. The slug is part of the documents'' public URLs (/documents/<slug>/<file>): it never changes once created.';

ALTER TABLE public.document_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Document collections: everyone reads" ON public.document_collections;
CREATE POLICY "Document collections: everyone reads"
  ON public.document_collections FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Document collections: admins add" ON public.document_collections;
CREATE POLICY "Document collections: admins add"
  ON public.document_collections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Document collections: admins edit" ON public.document_collections;
CREATE POLICY "Document collections: admins edit"
  ON public.document_collections FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Document collections: admins remove empty ones" ON public.document_collections;
CREATE POLICY "Document collections: admins remove empty ones"
  ON public.document_collections FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.document_collections FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.document_collections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.document_collections TO authenticated;
GRANT ALL ON TABLE public.document_collections TO service_role;

DROP TRIGGER IF EXISTS document_collections_updated_at ON public.document_collections;
CREATE TRIGGER document_collections_updated_at
  BEFORE UPDATE ON public.document_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS document_collections_revision ON public.document_collections;
CREATE TRIGGER document_collections_revision
  AFTER UPDATE OR DELETE ON public.document_collections
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();

-- 3. Documents --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.site_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL
    REFERENCES public.document_collections (id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  file_name text NOT NULL
    CHECK (file_name ~ '^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$' AND length(file_name) <= 150),
  storage_key text NOT NULL UNIQUE CHECK (length(storage_key) BETWEEN 1 AND 400),
  document_date date,
  date_precision text CHECK (date_precision IN ('day', 'month', 'year')),
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  mime_type text NOT NULL DEFAULT 'application/pdf'
    CHECK (mime_type = 'application/pdf'),
  visibility text NOT NULL DEFAULT 'members'
    CHECK (visibility IN ('public', 'members')),
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT site_documents_file_name_unique UNIQUE (collection_id, file_name),
  CONSTRAINT site_documents_date_precision CHECK (
    (document_date IS NULL) = (date_precision IS NULL)
  )
);

COMMENT ON TABLE public.site_documents IS
  'PDFs of « Documents de l''association »: object storage_key in the public bucket site-media, shown in the members area (visibility members) or anywhere (public). status archived hides a document from the site; only superadmins delete rows. Read by the website and the mobile app.';
COMMENT ON COLUMN public.site_documents.file_name IS
  'Last segment of the document''s URL /documents/<collection slug>/<file_name>; unique in its collection.';
COMMENT ON COLUMN public.site_documents.date_precision IS
  'How document_date is shown: day (21/06/2025), month (août 2024) or year (2024).';

CREATE INDEX IF NOT EXISTS site_documents_collection_idx
  ON public.site_documents (collection_id, status, document_date DESC NULLS LAST, sort_order DESC);

ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site documents: read published" ON public.site_documents;
CREATE POLICY "Site documents: read published"
  ON public.site_documents FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND (visibility = 'public' OR (SELECT auth.uid()) IS NOT NULL)
  );

DROP POLICY IF EXISTS "Site documents: admins read all" ON public.site_documents;
CREATE POLICY "Site documents: admins read all"
  ON public.site_documents FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Site documents: admins add" ON public.site_documents;
CREATE POLICY "Site documents: admins add"
  ON public.site_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Site documents: admins edit" ON public.site_documents;
CREATE POLICY "Site documents: admins edit"
  ON public.site_documents FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Site documents: superadmins delete" ON public.site_documents;
CREATE POLICY "Site documents: superadmins delete"
  ON public.site_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'superadmin'
    )
  );

REVOKE ALL ON TABLE public.site_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.site_documents TO authenticated;
GRANT ALL ON TABLE public.site_documents TO service_role;

DROP TRIGGER IF EXISTS site_documents_updated_at ON public.site_documents;
CREATE TRIGGER site_documents_updated_at
  BEFORE UPDATE ON public.site_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS site_documents_revision ON public.site_documents;
CREATE TRIGGER site_documents_revision
  AFTER UPDATE OR DELETE ON public.site_documents
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();

-- 4. Link resolution --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.site_document_object(p_collection text, p_file_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.storage_key
  FROM public.site_documents d
  JOIN public.document_collections c ON c.id = d.collection_id
  WHERE c.slug = p_collection
    AND d.file_name = p_file_name
    AND d.status = 'published'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.site_document_object(text, text) IS
  'Object key of a published document for its URL /documents/<collection>/<file>, whatever its visibility: documents stay openable by link (decision of 2026-10-08).';

REVOKE ALL ON FUNCTION public.site_document_object(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.site_document_object(text, text) TO anon, authenticated, service_role;

-- 5. Bucket and storage policies --------------------------------------------

-- Production already has the bucket (public, 50 MB, the #344 media types):
-- left as it is. Staging gets the same.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'audio/mpeg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Site media: admins read documents" ON storage.objects;
CREATE POLICY "Site media: admins read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'documents'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Site media: admins upload documents" ON storage.objects;
CREATE POLICY "Site media: admins upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'documents'
    AND lower(storage.extension(name)) = 'pdf'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Site media: admins replace documents" ON storage.objects;
CREATE POLICY "Site media: admins replace documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'documents'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'documents'
    AND lower(storage.extension(name)) = 'pdf'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Site media: superadmins delete documents" ON storage.objects;
CREATE POLICY "Site media: superadmins delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'superadmin'
    )
  );

-- 6. Existing documents -----------------------------------------------------

INSERT INTO public.document_collections (slug, label, description, sort_order)
VALUES
  ('ag', 'Assemblées générales', 'Comptes rendus, convocations et procurations des assemblées générales', 10),
  ('gazettes', 'Gazettes', 'Archives des gazettes', 20),
  ('pele-mele', 'Pêle-Mêle', 'Archives diverses', 30),
  ('textes', 'Textes de l''association', 'Statuts, règlement intérieur et charte', 40),
  ('programmes', 'Programmes de concert', 'Les programmes distribués aux concerts', 50)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_documents
  (collection_id, title, file_name, storage_key, document_date, date_precision, visibility, sort_order, size_bytes)
SELECT c.id, v.title, v.file_name, v.storage_key, v.document_date, v.date_precision, v.visibility, v.sort_order, v.size_bytes
FROM (VALUES
  ('ag', 'Compte rendu de l''AG 2024', 'Compte-Rendu-Assemblee-Generale-Ordinaire-2024.pdf', 'pdf/AG/Compte-Rendu-Assemblee-Generale-Ordinaire-2024.pdf', '2024-01-01'::date, 'year', 'members', 0, 176959),
  ('ag', 'Compte rendu de l''AG 2022', 'Compte-Rendu-Assemblee-Generale-Ordinaire-2022.pdf', 'pdf/AG/Compte-Rendu-Assemblee-Generale-Ordinaire-2022.pdf', '2022-01-01'::date, 'year', 'members', 0, 175659),
  ('ag', 'Compte rendu de l''AG 2021', 'Compte-Rendu-Assemblee-Generale-Ordinaire-2021.pdf', 'pdf/AG/Compte-Rendu-Assemblee-Generale-Ordinaire-2021.pdf', '2021-01-01'::date, 'year', 'members', 0, 175817),
  ('ag', 'Compte rendu de l''AG 2020', 'Compte-Rendu-Assemblee-Generale-Ordinaire-2020.pdf', 'pdf/AG/Compte-Rendu-Assemblee-Generale-Ordinaire-2020.pdf', '2020-01-01'::date, 'year', 'members', 0, 180124),
  ('ag', 'Compte rendu de l''AG 2019', 'Compte-Rendu_Assemblee_Generale_Ordinaire_2019.pdf', 'pdf/AG/Compte-Rendu_Assemblee_Generale_Ordinaire_2019.pdf', '2019-01-01'::date, 'year', 'members', 0, 180538),
  ('ag', 'Compte rendu de l''AG 2018', 'Compte-Rendu_Assemblee_Generale_Ordinaire_2018.pdf', 'pdf/AG/Compte-Rendu_Assemblee_Generale_Ordinaire_2018.pdf', '2018-01-01'::date, 'year', 'members', 0, 178385),
  ('ag', 'Compte rendu de l''AG 2017', 'Compte-Rendu_Assemblee_Generale_Ordinaire_2017.pdf', 'pdf/AG/Compte-Rendu_Assemblee_Generale_Ordinaire_2017.pdf', '2017-01-01'::date, 'year', 'members', 0, 178723),
  ('ag', 'Compte rendu de l''AG 2016', 'Compte-Rendu_Assemblee_Generale_Ordinaire_2016.pdf', 'pdf/AG/Compte-Rendu_Assemblee_Generale_Ordinaire_2016.pdf', '2016-01-01'::date, 'year', 'members', 0, 27786),
  ('ag', 'Compte rendu de l''AG 2015', 'Compte-Rendu_Assemblee_Generale_Ordinaire_2015.pdf', 'pdf/AG/Compte-Rendu_Assemblee_Generale_Ordinaire_2015.pdf', '2015-01-01'::date, 'year', 'members', 0, 38441),
  ('ag', 'Convocation à l''AG du 14 mars 2026', 'convocation_AG_2026.pdf', 'pdf/AG_2026/convocation_AG_2026.pdf', '2026-03-14'::date, 'day', 'public', 1, 199221),
  ('ag', 'Procuration pour l''AG du 14 mars 2026', 'procuration_AG_2026.pdf', 'pdf/AG_2026/procuration_AG_2026.pdf', '2026-03-14'::date, 'day', 'public', 0, 174083),
  ('gazettes', 'Gazette du 21/06/2025', 'gazette_2025_06_21.pdf', 'pdf/Gazettes/gazette_2025_06_21.pdf', '2025-06-21'::date, 'day', 'members', 0, 703269),
  ('gazettes', 'Gazette hors-série du 18/08/2024', 'gazette_2024_08.pdf', 'pdf/Gazettes/gazette_2024_08.pdf', '2024-08-18'::date, 'day', 'members', 0, 2356739),
  ('gazettes', 'Gazette du 05/02/2023', 'gazette_2023_02_05.pdf', 'pdf/Gazettes/gazette_2023_02_05.pdf', '2023-02-05'::date, 'day', 'members', 1, 544128),
  ('gazettes', 'Supplément à la gazette du 05/02/2023', 'gazette_2023_02_05-supp.pdf', 'pdf/Gazettes/gazette_2023_02_05-supp.pdf', '2023-02-05'::date, 'day', 'members', 0, 1201280),
  ('gazettes', 'Gazette du 30/06/2019', 'gazette19_06_30.pdf', 'pdf/Gazettes/gazette19_06_30.pdf', '2019-06-30'::date, 'day', 'members', 0, 2853696),
  ('gazettes', 'Gazette du 14/06/2019', 'gazette19_06_14.pdf', 'pdf/Gazettes/gazette19_06_14.pdf', '2019-06-14'::date, 'day', 'members', 0, 1136386),
  ('gazettes', 'Gazette du 26/05/2019', 'gazette19_05_26.pdf', 'pdf/Gazettes/gazette19_05_26.pdf', '2019-05-26'::date, 'day', 'members', 0, 473690),
  ('gazettes', 'Gazette du 07/04/2019', 'gazette19_04_07.pdf', 'pdf/Gazettes/gazette19_04_07.pdf', '2019-04-07'::date, 'day', 'members', 0, 3427453),
  ('gazettes', 'Gazette du 16/03/2019', 'gazette19_03_16.pdf', 'pdf/Gazettes/gazette19_03_16.pdf', '2019-03-16'::date, 'day', 'members', 0, 6142756),
  ('gazettes', 'Gazette du 03/02/2019', 'gazette19_02_03.pdf', 'pdf/Gazettes/gazette19_02_03.pdf', '2019-02-03'::date, 'day', 'members', 0, 429026),
  ('gazettes', 'Gazette du 13/01/2019', 'gazette19_01_13.pdf', 'pdf/Gazettes/gazette19_01_13.pdf', '2019-01-13'::date, 'day', 'members', 0, 499100),
  ('gazettes', 'Gazette du 02/12/2018', 'gazette18_12_02.pdf', 'pdf/Gazettes/gazette18_12_02.pdf', '2018-12-02'::date, 'day', 'members', 0, 1152437),
  ('gazettes', 'Gazette du 04/11/2018', 'gazette18_11_04.pdf', 'pdf/Gazettes/gazette18_11_04.pdf', '2018-11-04'::date, 'day', 'members', 0, 960930),
  ('gazettes', 'Gazette du 14/10/2018', 'gazette18_10_14.pdf', 'pdf/Gazettes/gazette18_10_14.pdf', '2018-10-14'::date, 'day', 'members', 0, 952180),
  ('pele-mele', 'Pêle-Mêle N°2', 'pm_2.pdf', 'pdf/PM/pm_2.pdf', NULL, NULL, 'members', 2, 1443402),
  ('pele-mele', 'Pêle-Mêle N°1', 'pm_1.pdf', 'pdf/PM/pm_1.pdf', NULL, NULL, 'members', 1, 1941982),
  ('textes', 'Statuts du Bon Tempérament', 'Statuts_Le_Bon_Temperament.pdf', 'pdf/Statuts_Le_Bon_Temperament.pdf', NULL, NULL, 'members', 3, 29507),
  ('textes', 'Règlement intérieur', 'reglement.pdf', 'pdf/reglement.pdf', NULL, NULL, 'members', 2, 9453),
  ('textes', 'Charte du Bon Tempérament', 'charte_BT.pdf', 'pdf/charte_BT.pdf', NULL, NULL, 'members', 1, 41488),
  ('programmes', 'Entre Terre et Ciel', 'Entre_Terre_et_Ciel_2025.pdf', 'pdf/Programmes/Entre_Terre_et_Ciel_2025.pdf', '2025-01-01'::date, 'year', 'public', 0, 432874)
) AS v (collection, title, file_name, storage_key, document_date, date_precision, visibility, sort_order, size_bytes)
JOIN public.document_collections c ON c.slug = v.collection
ON CONFLICT (storage_key) DO NOTHING;
