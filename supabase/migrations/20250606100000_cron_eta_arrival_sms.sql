-- Migration: Schedule check-eta-and-send-arrival-sms Edge Function
-- Description: Runs every minute to check ETA for active deliveries and send
-- "5 min away" SMS when driver is within 5 minutes of recipient.
--
-- Prerequisites: Store project_url and anon_key in Supabase Vault:
--   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
--   select vault.create_secret('YOUR_ANON_KEY', 'anon_key');
-- (Use Dashboard > Project Settings > API to find the anon key)

-- Enable extensions (may already be enabled via Dashboard > Database > Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Only invoke the Edge Function when at least one delivery has active tracking.
-- When no tracking is active, the cron runs a cheap EXISTS check and skips the HTTP call,
-- avoiding Edge Function invocations and keeping costs low.
SELECT cron.schedule(
  'check-eta-arrival-sms',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/check-eta-and-send-arrival-sms',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id
  FROM (SELECT 1) AS _dummy
  WHERE EXISTS (
    SELECT 1 FROM deliveries
    WHERE is_tracking_active = true
      AND current_recipient_id IS NOT NULL
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
  );
  $$
);
