-- Calendar sync: run every hour from 07:00 to 22:00 (Europe/Paris) instead of
-- at 07:00 and 19:00 only.
--
-- The job already fires every hour ('0 * * * *'); its SQL body only lets the
-- 07:00 and 19:00 runs through (`... IN (7, 19)`). This widens that guard in
-- place, so the headers, the URL and the other settings of the job stay as
-- they are (the key-headers migration rewrote them).
--
-- A run where nothing changed costs one Google read and no AI call for the
-- rehearsals already known; events that are not rehearsals are asked to the
-- AI again at each run (about 2 today).
--
-- Rollback: replace 'BETWEEN 7 AND 22' by 'IN (7, 19)' in the job's command
-- (cron.alter_job).

DO $$
DECLARE
  v_job record;
BEGIN
  SELECT jobid, command INTO v_job
    FROM cron.job
   WHERE jobname = 'sync-rehearsals-from-calendar';

  IF NOT FOUND THEN
    RAISE NOTICE 'Job sync-rehearsals-from-calendar not found: nothing changed';
    RETURN;
  END IF;

  IF position('IN (7, 19)' IN v_job.command) = 0 THEN
    RAISE NOTICE 'Job guard is not "IN (7, 19)" (already changed?): nothing changed';
    RETURN;
  END IF;

  PERFORM cron.alter_job(
    v_job.jobid,
    command := replace(v_job.command, 'IN (7, 19)', 'BETWEEN 7 AND 22')
  );
END;
$$;
