-- Documents attached to events (Thomas, 2026-10-11): a « bulletin de
-- réservation » for a cheese sale, a programme for a stay… PDF, Word or
-- Excel, added in the admin, downloaded from the website and the app.
--
-- 1. event_documents: one row per file, in the public bucket site-media under
--    events/<event id>/. A file is readable where its event is: anyone for a
--    public event, signed-in members for a members-only one. Object keys hold
--    a random id, so a link is only known to those who were shown it (same
--    posture as the association's documents, decision of 2026-10-08).
-- 2. site-media also accepts Word and Excel files.
-- 3. Storage policies letting admins add and remove files under events/.
--
-- Backward compatible: only new objects; installed apps never read them.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.event_documents;
--   DROP POLICY "Site media: admins read event files" ON storage.objects;
--   DROP POLICY "Site media: admins upload event files" ON storage.objects;
--   DROP POLICY "Site media: admins delete event files" ON storage.objects;
--   (the bucket's extra MIME types can stay)

-- 1. Table ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 120),
  file_name text NOT NULL CHECK (
    file_name ~ '^[A-Za-z0-9][A-Za-z0-9._-]*\.(pdf|doc|docx|xls|xlsx)$'
    AND length(file_name) <= 150
  ),
  storage_key text NOT NULL UNIQUE
    CHECK (storage_key LIKE 'events/%' AND length(storage_key) <= 400),
  mime_type text NOT NULL CHECK (mime_type IN (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )),
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_documents IS
  'Files attached to an event (PDF, Word, Excel): object storage_key in the public bucket site-media under events/<event id>/. Readable where the event is: anyone for a public event, signed-in members otherwise. Read by the website and the mobile app.';

CREATE INDEX IF NOT EXISTS event_documents_event_idx
  ON public.event_documents (event_id, sort_order, created_at);

ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event documents: read with the event" ON public.event_documents;
CREATE POLICY "Event documents: read with the event"
  ON public.event_documents FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_documents.event_id
      AND (e.is_public OR (SELECT auth.uid()) IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Event documents: admins add" ON public.event_documents;
CREATE POLICY "Event documents: admins add"
  ON public.event_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Event documents: admins edit" ON public.event_documents;
CREATE POLICY "Event documents: admins edit"
  ON public.event_documents FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Event documents: admins remove" ON public.event_documents;
CREATE POLICY "Event documents: admins remove"
  ON public.event_documents FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.event_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.event_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.event_documents TO authenticated;
GRANT ALL ON TABLE public.event_documents TO service_role;

DROP TRIGGER IF EXISTS event_documents_updated_at ON public.event_documents;
CREATE TRIGGER event_documents_updated_at
  BEFORE UPDATE ON public.event_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Word and Excel in site-media -------------------------------------------

UPDATE storage.buckets
SET allowed_mime_types = ARRAY(
  SELECT DISTINCT unnest(
    COALESCE(allowed_mime_types, ARRAY[]::text[]) || ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
)
WHERE id = 'site-media' AND allowed_mime_types IS NOT NULL;

-- 3. Storage policies ---------------------------------------------------------

DROP POLICY IF EXISTS "Site media: admins read event files" ON storage.objects;
CREATE POLICY "Site media: admins read event files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'events'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Site media: admins upload event files" ON storage.objects;
CREATE POLICY "Site media: admins upload event files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'events'
    AND lower(storage.extension(name)) IN ('pdf', 'doc', 'docx', 'xls', 'xlsx')
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Site media: admins delete event files" ON storage.objects;
CREATE POLICY "Site media: admins delete event files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND (storage.foldername(name))[1] = 'events'
    AND public.is_admin()
  );
