-- Migration: signalements from the mobile app, with screenshots and pushes
--
-- Members report a problem from the app (optionally with up to three
-- screenshots); superadmins read and answer them in the app or the admin, and
-- both sides get a push when the other writes.
--
-- Additive, plus three rules made stricter or wider on purpose:
--   1. bug_reports: screenshot_paths (up to 3 files in the bucket below),
--      source ('admin' or 'app') and app_info (app version and system, for
--      the superadmin reading the report). Existing rows keep [] / 'admin'.
--   2. Private bucket bug-screenshots (5 MB, JPEG/PNG/WebP). A member writes
--      only in their own folder (<user id>/…); the reporter and superadmins
--      read; the reporter (before sending) and superadmins delete.
--   3. Reports: a new report must point only at screenshots in its author's
--      folder (stricter INSERT policy, same name).
--   4. Messages: a reply is written by the report's author or a superadmin,
--      as themselves. Until now any admin could write in any report and the
--      author could not answer at all (the old policy "Admin can create
--      messages" is replaced).
--   5. mark_bug_report_read(report): the author or a superadmin marks the
--      other side's messages read (and, for a superadmin, the report).
--      Members have no UPDATE right on bug_messages, so this goes through a
--      function that changes only is_read.
--   6. register_push_device(): every signed-in member's phone is kept, not
--      only superadmins', so a member can receive the reply to a report.
--      check-ops-alerts already selects superadmins' tokens only, so alerts
--      still reach superadmins alone.
--   7. Trigger notify_bug_report_push on new reports and new messages: calls
--      the edge function notify-bug-report (Vault secrets project_url,
--      anon_key, internal_function_secret, as the other push trigger; without
--      them, as on staging, it does nothing).
--
-- Prerequisite for the pushes: deploy supabase/functions/notify-bug-report.
-- Applying this before the function exists is harmless: pg_net records a 404
-- and the report is saved.
--
-- Rollback:
--   DROP TRIGGER notify_bug_report_push ON public.bug_reports;
--   DROP TRIGGER notify_bug_message_push ON public.bug_messages;
--   DROP FUNCTION public.notify_bug_report_push();
--   DROP FUNCTION public.mark_bug_report_read(uuid);
--   re-create register_push_device() from 20261007140000;
--   re-create the policies "Admin can create messages" and
--   "Users can create bug reports" from supabase/staging/01_schema.sql;
--   DROP the four storage policies "Bug screenshots: …", empty and delete
--   the bucket; ALTER TABLE public.bug_reports DROP COLUMN screenshot_paths,
--   DROP COLUMN source, DROP COLUMN app_info.

-- 1. Report columns.
ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS screenshot_paths text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS app_info text;

ALTER TABLE public.bug_reports
  DROP CONSTRAINT IF EXISTS bug_reports_source_check,
  ADD CONSTRAINT bug_reports_source_check CHECK (source IN ('admin', 'app'));

ALTER TABLE public.bug_reports
  DROP CONSTRAINT IF EXISTS bug_reports_screenshots_max,
  ADD CONSTRAINT bug_reports_screenshots_max
    CHECK (cardinality(screenshot_paths) <= 3);

-- Lengths for new rows only (NOT VALID leaves existing rows alone).
ALTER TABLE public.bug_reports
  DROP CONSTRAINT IF EXISTS bug_reports_lengths,
  ADD CONSTRAINT bug_reports_lengths CHECK (
    length(title) BETWEEN 1 AND 200
    AND length(description) BETWEEN 1 AND 5000
    AND (app_info IS NULL OR length(app_info) <= 200)
  ) NOT VALID;

ALTER TABLE public.bug_messages
  DROP CONSTRAINT IF EXISTS bug_messages_length,
  ADD CONSTRAINT bug_messages_length
    CHECK (length(message) BETWEEN 1 AND 5000) NOT VALID;

COMMENT ON COLUMN public.bug_reports.screenshot_paths IS
  'Up to 3 object names in the private bucket bug-screenshots, all in the author''s folder (<user id>/…).';
COMMENT ON COLUMN public.bug_reports.source IS
  'Where the report was written: admin (the admin dashboard) or app (the mobile app).';
COMMENT ON COLUMN public.bug_reports.app_info IS
  'App version and system of the phone that sent the report (app only).';

-- 2. Screenshot bucket and its policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bug-screenshots',
  'bug-screenshots',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Bug screenshots: members upload to their folder" ON storage.objects;
CREATE POLICY "Bug screenshots: members upload to their folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bug-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Bug screenshots: author and superadmins read" ON storage.objects;
CREATE POLICY "Bug screenshots: author and superadmins read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    )
  );

DROP POLICY IF EXISTS "Bug screenshots: author and superadmins delete" ON storage.objects;
CREATE POLICY "Bug screenshots: author and superadmins delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    )
  );

-- 3. A new report names only screenshots from its author's folder.
DROP POLICY IF EXISTS "Users can create bug reports" ON public.bug_reports;
CREATE POLICY "Users can create bug reports"
  ON public.bug_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reported_by
    AND NOT EXISTS (
      SELECT 1 FROM unnest(screenshot_paths) AS p (path)
      WHERE p.path NOT LIKE auth.uid()::text || '/%'
         OR p.path LIKE '%..%'
    )
  );

-- 4. Replies: the report's author or a superadmin, as themselves.
DROP POLICY IF EXISTS "Admin can create messages" ON public.bug_messages;
DROP POLICY IF EXISTS "Author and superadmins can post messages" ON public.bug_messages;
CREATE POLICY "Author and superadmins can post messages"
  ON public.bug_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bug_reports
      WHERE bug_reports.id = bug_messages.bug_report_id
      AND (
        bug_reports.reported_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'superadmin'
        )
      )
    )
  );

-- 5. Marking the other side's messages read.
CREATE OR REPLACE FUNCTION public.mark_bug_report_read(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_superadmin boolean;
  _author uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;

  SELECT reported_by INTO _author FROM public.bug_reports WHERE id = p_report_id;
  IF _author IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'superadmin'
  ) INTO _is_superadmin;

  IF _author <> _uid AND NOT _is_superadmin THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  UPDATE public.bug_messages
     SET is_read = true
   WHERE bug_report_id = p_report_id
     AND sender_id <> _uid
     AND is_read = false;

  IF _is_superadmin THEN
    UPDATE public.bug_reports
       SET is_read = true
     WHERE id = p_report_id
       AND is_read = false;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_bug_report_read(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_bug_report_read(uuid) TO authenticated;

-- 6. Every member's phone can be registered (was: superadmins only).
CREATE OR REPLACE FUNCTION public.register_push_device(p_token text, p_platform text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;
  IF p_token IS NULL OR length(p_token) < 20 OR length(p_token) > 4096 THEN
    RAISE EXCEPTION 'Invalid token' USING ERRCODE = '22023';
  END IF;
  IF p_platform IS NULL OR p_platform NOT IN ('android', 'ios') THEN
    RAISE EXCEPTION 'Invalid platform' USING ERRCODE = '22023';
  END IF;

  -- A phone belongs to whoever signed in on it last.
  INSERT INTO public.push_devices (token, user_id, platform)
  VALUES (p_token, _uid, p_platform)
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        last_seen_at = now();
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.register_push_device(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_push_device(text, text) TO authenticated;

COMMENT ON TABLE public.push_devices IS
  'FCM registration tokens of signed-in members'' phones: replies to their signalements, and for superadmins the production alerts (check-ops-alerts) and new signalements. Written only through register_push_device() / unregister_push_device(); read by edge functions with the service role. Tokens FCM reports as unregistered are deleted at send time.';

-- 7. Push on a new report or a new message.
CREATE OR REPLACE FUNCTION public.notify_bug_report_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _url text;
  _key text;
  _secret text;
BEGIN
  IF current_setting('app.silence_push', true) = 'true' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO _url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'anon_key';
  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF _url IS NULL OR _key IS NULL OR _secret IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only ids: the function reads the rows itself.
  PERFORM net.http_post(
    url := _url || '/functions/v1/notify-bug-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key,
      'x-internal-secret', _secret
    ),
    body := jsonb_build_object(
      'kind', CASE TG_TABLE_NAME WHEN 'bug_reports' THEN 'report' ELSE 'message' END,
      'id', NEW.id
    ),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_bug_report_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_bug_report_push ON public.bug_reports;
CREATE TRIGGER notify_bug_report_push
  AFTER INSERT ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_bug_report_push();

DROP TRIGGER IF EXISTS notify_bug_message_push ON public.bug_messages;
CREATE TRIGGER notify_bug_message_push
  AFTER INSERT ON public.bug_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_bug_report_push();
