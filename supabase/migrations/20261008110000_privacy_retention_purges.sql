-- Migration: the purges the privacy policy promises
-- Refs #355
--
-- The policy (/politique-de-confidentialite, « Durées de conservation »)
-- promises three things the database didn't do:
--   - a memory's e-mail address is erased once the memory is reviewed;
--   - signalements are kept 1 year at most after they are resolved;
--   - (new line in the policy) sync logs are kept 90 days.
-- Contact messages live in the association's Gmail, not here: see
-- scripts/gmail/purge-contact-messages.gs.
--
-- 1. anniversary_memories
--    a. email becomes nullable and is erased when a memory is approved
--       (trigger), including the memories already approved.
--    b. New memories always start pending: the visitors' INSERT policy no
--       longer accepts a row already approved or featured.
--    c. Admins may delete a memory. There was no DELETE policy, so the
--       admin's « Supprimer » removed nothing (and kept the e-mail).
-- 2. bug_reports.resolved_at, set when a report is marked resolved and
--    cleared if it is reopened (trigger). Reports resolved before this
--    migration get the date of their last message (or their creation).
-- 3. purge_expired_records(), daily at 03:45 UTC through pg_cron:
--    - signalements resolved more than 1 year ago, with their messages and
--      their in-app notifications. A report that still lists screenshots is
--      kept until the edge function purge-bug-screenshots has removed its
--      files (Storage objects can't be deleted from SQL);
--    - rehearsal_sync_logs and drive_sync_runs older than 90 days, except
--      the latest run of each mode and the latest successful Drive apply
--      (the admin and check-ops-alerts read those).
-- 4. Cron job purge-bug-screenshots, daily at 03:40 UTC: calls the edge
--    function of the same name (Vault secrets project_url, anon_key,
--    internal_function_secret, as the other cron functions). Without the
--    secrets, as on staging, it does nothing. Until the function is
--    deployed, pg_net records a 404 once a day and reports with screenshots
--    simply wait.
--
-- First run on production (counted 2026-10-08): the migration erases 3
-- memory e-mails; the first nightly purge deletes 17 rehearsal sync logs
-- (June-July 2026) and no signalement (none is resolved yet).
--
-- Rollback:
--   SELECT cron.unschedule('purge-expired-records');
--   SELECT cron.unschedule('purge-bug-screenshots');
--   DROP FUNCTION public.purge_expired_records();
--   DROP TRIGGER bug_reports_resolved_at ON public.bug_reports;
--   DROP FUNCTION public.set_bug_report_resolved_at();
--   ALTER TABLE public.bug_reports DROP COLUMN resolved_at;
--   DROP TRIGGER anniversary_memories_erase_email ON public.anniversary_memories;
--   DROP FUNCTION public.erase_reviewed_memory_email();
--   DROP POLICY "Allow admin delete on anniversary_memories" ON public.anniversary_memories;
--   re-create "Allow anon insert on anniversary_memories" WITH CHECK (true).
-- Erased e-mails and purged rows can't be restored (except from a backup);
-- email can only become NOT NULL again once every row has one.

-- 1a. Memory e-mails erased after review.
ALTER TABLE public.anniversary_memories
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.anniversary_memories.email IS
  'Only to acknowledge receipt; erased (NULL) once the memory is approved, as the privacy policy promises.';

CREATE OR REPLACE FUNCTION public.erase_reviewed_memory_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_approved IS TRUE THEN
    NEW.email := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS anniversary_memories_erase_email ON public.anniversary_memories;
CREATE TRIGGER anniversary_memories_erase_email
  BEFORE INSERT OR UPDATE ON public.anniversary_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.erase_reviewed_memory_email();

UPDATE public.anniversary_memories
   SET email = NULL
 WHERE is_approved IS TRUE
   AND email IS NOT NULL;

-- 1b. New memories start pending.
DROP POLICY IF EXISTS "Allow anon insert on anniversary_memories" ON public.anniversary_memories;
CREATE POLICY "Allow anon insert on anniversary_memories"
  ON public.anniversary_memories
  FOR INSERT
  WITH CHECK (
    is_approved IS NOT TRUE
    AND is_featured IS NOT TRUE
  );

-- 1c. Admins delete memories.
DROP POLICY IF EXISTS "Allow admin delete on anniversary_memories" ON public.anniversary_memories;
CREATE POLICY "Allow admin delete on anniversary_memories"
  ON public.anniversary_memories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])
    )
  );

-- 2. When a signalement was resolved.
ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

COMMENT ON COLUMN public.bug_reports.resolved_at IS
  'When the report was last marked resolved (NULL while open). The report is purged 1 year later (purge_expired_records).';

-- Reports resolved before this migration: the last trace of activity.
UPDATE public.bug_reports r
   SET resolved_at = GREATEST(
         r.created_at,
         (SELECT max(m.created_at) FROM public.bug_messages m WHERE m.bug_report_id = r.id)
       )
 WHERE r.status = 'resolved'
   AND r.resolved_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_bug_report_resolved_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'resolved' THEN
    NEW.resolved_at := NULL;
  ELSIF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'resolved' THEN
    NEW.resolved_at := now();
  ELSE
    NEW.resolved_at := OLD.resolved_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bug_reports_resolved_at ON public.bug_reports;
CREATE TRIGGER bug_reports_resolved_at
  BEFORE INSERT OR UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_bug_report_resolved_at();

-- 3. The daily purge.
CREATE OR REPLACE FUNCTION public.purge_expired_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _expired uuid[];
  _reports integer;
  _rehearsal_logs integer;
  _drive_runs integer;
BEGIN
  SELECT coalesce(array_agg(id), '{}')
    INTO _expired
    FROM bug_reports
   WHERE status = 'resolved'
     AND resolved_at < now() - interval '1 year'
     AND cardinality(screenshot_paths) = 0;

  DELETE FROM notifications WHERE bug_report_id = ANY (_expired);
  DELETE FROM bug_messages WHERE bug_report_id = ANY (_expired);
  DELETE FROM bug_reports WHERE id = ANY (_expired);
  GET DIAGNOSTICS _reports = ROW_COUNT;

  DELETE FROM rehearsal_sync_logs
   WHERE started_at < now() - interval '90 days'
     AND id NOT IN (
       SELECT DISTINCT ON (mode) id
         FROM rehearsal_sync_logs
        ORDER BY mode, started_at DESC
     );
  GET DIAGNOSTICS _rehearsal_logs = ROW_COUNT;

  DELETE FROM drive_sync_runs
   WHERE started_at < now() - interval '90 days'
     AND id NOT IN (
       SELECT DISTINCT ON (mode) id
         FROM drive_sync_runs
        ORDER BY mode, started_at DESC
     )
     AND id IS DISTINCT FROM (
       SELECT id
         FROM drive_sync_runs
        WHERE mode = 'apply' AND status = 'success'
        ORDER BY started_at DESC
        LIMIT 1
     );
  GET DIAGNOSTICS _drive_runs = ROW_COUNT;

  RETURN jsonb_build_object(
    'bug_reports', _reports,
    'rehearsal_sync_logs', _rehearsal_logs,
    'drive_sync_runs', _drive_runs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_records() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-records') THEN
    PERFORM cron.unschedule('purge-expired-records');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-bug-screenshots') THEN
    PERFORM cron.unschedule('purge-bug-screenshots');
  END IF;
END;
$$;

SELECT cron.schedule(
  'purge-expired-records',
  '45 3 * * *',
  $$ SELECT public.purge_expired_records(); $$
);

-- 4. Screenshots of expired signalements, through the Storage API.
SELECT cron.schedule(
  'purge-bug-screenshots',
  '40 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/purge-bug-screenshots',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url');
  $$
);
