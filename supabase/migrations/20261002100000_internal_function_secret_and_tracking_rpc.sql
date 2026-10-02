-- Migration: internal secret for cron/trigger calls, token-checked tracking read
-- Refs #311, #312
--
-- Part 1 of 2, additive and safe to apply before the code that uses it:
--   1. The push-notification trigger and the ETA cron job send `x-internal-secret`
--      (Vault secret `internal_function_secret`), which the redeployed
--      `send-push-notification` and `check-eta-and-send-arrival-sms` require.
--      Functions deployed before this change ignore the extra header.
--   2. `get_tracking_by_recipient_token(token)` returns only what the public
--      tracking page shows, for one recipient's own link, while the round
--      hasn't expired. The page switches to it; part 2
--      (20261002100100_restrict_delivery_tracking_reads.sql) then removes
--      the direct table reads.
--
-- Prerequisite (owner, once, same value as the function secret
-- INTERNAL_FUNCTION_SECRET):
--   select vault.create_secret('<random hex 32>', 'internal_function_secret');
--
-- Rollback: re-run the previous definitions of notify_push_notification()
-- (20260626090000_add_rehearsals_calendar_sync.sql) and of the
-- check-eta-arrival-sms job (20250606100000_cron_eta_arrival_sms.sql), and
-- `DROP FUNCTION public.get_tracking_by_recipient_token(text);`.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'internal_function_secret'
  ) THEN
    RAISE EXCEPTION 'Create the Vault secret internal_function_secret before applying this migration';
  END IF;
END;
$$;

-- 1a. Push-notification trigger: same body as 20260626090000, plus the secret header.
CREATE OR REPLACE FUNCTION public.notify_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _key text;
  _secret text;
  _body jsonb;
  _row jsonb;
  _op text;
BEGIN
  IF current_setting('app.silence_push', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT decrypted_secret INTO _url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'anon_key';
  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF _url IS NULL OR _key IS NULL OR _secret IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  _op := TG_OP;
  IF _op = 'DELETE' THEN
    _row := to_jsonb(OLD);
  ELSE
    _row := to_jsonb(NEW);
  END IF;

  _body := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', _op,
    'record', _row
  );

  PERFORM net.http_post(
    url := _url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key,
      'x-internal-secret', _secret
    ),
    body := _body,
    timeout_milliseconds := 15000
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 1b. ETA cron job: same schedule and guard as 20250606100000, plus the secret header.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-eta-arrival-sms') THEN
    PERFORM cron.unschedule('check-eta-arrival-sms');
  END IF;
END;
$$;

SELECT cron.schedule(
  'check-eta-arrival-sms',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/check-eta-and-send-arrival-sms',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
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

-- 2. Token-checked read for the public tracking page (/track?token=...).
--    Returns null for an unknown token or an expired round. Never returns
--    phone numbers, addresses, other recipients or tokens.
CREATE OR REPLACE FUNCTION public.get_tracking_by_recipient_token(token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'recipient', jsonb_build_object(
      'id', r.id,
      'delivery_id', r.delivery_id,
      'label', r.label,
      'scheduled_at', r.scheduled_at,
      'delivered_at', r.delivered_at,
      'latitude', r.latitude,
      'longitude', r.longitude
    ),
    'delivery', jsonb_build_object(
      'id', d.id,
      'latitude', d.latitude,
      'longitude', d.longitude,
      'is_tracking_active', d.is_tracking_active,
      'expires_at', d.expires_at,
      'updated_at', d.updated_at,
      'scheduled_at', d.scheduled_at,
      'scheduled_end_at', d.scheduled_end_at,
      'is_delayed', d.is_delayed,
      'delay_minutes', d.delay_minutes,
      'problem_message', d.problem_message,
      'current_recipient_id', d.current_recipient_id
    )
  )
  FROM delivery_recipients r
  JOIN deliveries d ON d.id = r.delivery_id
  WHERE r.public_token = token
    AND d.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_tracking_by_recipient_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tracking_by_recipient_token(text) TO anon, authenticated;
