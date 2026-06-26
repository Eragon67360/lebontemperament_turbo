-- Migration: Schedule automated Google Calendar -> rehearsals sync
-- Description:
--   Uses pg_cron + pg_net to invoke sync-rehearsals-from-calendar at
--   07:00 and 19:00 Europe/Paris. The cron expression runs hourly, while
--   the SQL body guards on Europe/Paris local hour so DST is handled by
--   Postgres timezone rules.
--
-- Prerequisites (run once, replace placeholders):
--   select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'project_url');
--   select vault.create_secret('YOUR_ANON_KEY',                    'anon_key');
--   select vault.create_secret('<random hex 32>',                   'sync_cron_secret');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-rehearsals-from-calendar') THEN
    PERFORM cron.unschedule('sync-rehearsals-from-calendar');
  END IF;
END;
$$;

SELECT cron.schedule(
  'sync-rehearsals-from-calendar',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/sync-rehearsals-from-calendar?mode=cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
      'x-sync-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id
  FROM (SELECT 1) AS _guard
  WHERE EXTRACT(HOUR FROM now() AT TIME ZONE 'Europe/Paris')::int IN (7, 19);
  $$
);
