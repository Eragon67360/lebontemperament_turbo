-- Migration: keep pg_cron's run history to 7 days
--
-- pg_cron logs every run in cron.job_run_details and never deletes it.
-- `check-eta-arrival-sms` runs every minute, so on 2026-10-04 the table held
-- 1 328 MB of the database's 1 396 MB (real data: ~70 MB). This keeps the
-- database small enough for Supabase's Free plan (500 MB).
--
-- 1. Empties the table once. TRUNCATE gives the disk space back at once, which
--    DELETE wouldn't without a VACUUM FULL. Only cron's own run log is lost;
--    the syncs keep theirs (rehearsal_sync_logs, drive_sync_runs).
-- 2. Deletes runs older than 7 days, every day at 03:15 UTC.
--
-- Rollback: `SELECT cron.unschedule('purge-cron-run-history');` and
-- `DROP FUNCTION public.purge_cron_run_history();`. Truncated history can't be
-- restored (except from a database backup).

TRUNCATE cron.job_run_details;

CREATE OR REPLACE FUNCTION public.purge_cron_run_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, pg_temp
AS $$
DECLARE
  _deleted integer;
BEGIN
  DELETE FROM cron.job_run_details
   WHERE end_time < now() - interval '7 days';
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_cron_run_history() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-cron-run-history') THEN
    PERFORM cron.unschedule('purge-cron-run-history');
  END IF;
END;
$$;

SELECT cron.schedule(
  'purge-cron-run-history',
  '15 3 * * *',
  $$ SELECT public.purge_cron_run_history(); $$
);
