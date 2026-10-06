-- Migration: production alerts pushed to the superadmins' phones
-- Refs #364
--
-- Additive only (two new tables, four new functions, one new cron job):
--   1. push_devices: FCM tokens of the superadmins' phones, written by the
--      app through register_push_device() / unregister_push_device().
--      Only a superadmin's session can register a token; nobody reads or
--      writes the table directly from a client.
--   2. ops_alerts: one row per alert (rehearsal sync, Drive sync, cron jobs,
--      function calls, website, admin) with its state, so each problem is
--      pushed once when it starts, once a day while it lasts, once when it ends.
--   3. ops_alert_facts(): what check-ops-alerts reads from the database
--      (latest cron sync runs, failed pg_cron runs, failed pg_net calls).
--      service_role only.
--   4. Cron job check-ops-alerts, every 15 minutes at :07, :22, :37, :52
--      (after the syncs that start at :00 and :30).
--
-- Prerequisite: the Vault secrets project_url, anon_key and
-- internal_function_secret (already used by the push trigger and the ETA cron).
--
-- Rollback:
--   SELECT cron.unschedule('check-ops-alerts');
--   DROP FUNCTION public.ops_alert_facts(integer);
--   DROP FUNCTION public.register_push_device(text, text);
--   DROP FUNCTION public.unregister_push_device(text);
--   DROP TABLE public.ops_alerts;
--   DROP TABLE public.push_devices;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'internal_function_secret'
  ) THEN
    RAISE EXCEPTION 'Create the Vault secret internal_function_secret before applying this migration';
  END IF;
END;
$$;

-- 1. Phones that receive the alerts.
CREATE TABLE IF NOT EXISTS public.push_devices (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_devices_user_id_idx
  ON public.push_devices (user_id);

COMMENT ON TABLE public.push_devices IS
  'FCM registration tokens of superadmins'' phones, for the production alerts (check-ops-alerts). Written only through register_push_device() / unregister_push_device(); read by edge functions with the service role. Tokens FCM reports as unregistered are deleted at send time.';

-- RLS on, no policy: clients go through the two functions below.
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

-- 2. Alert state.
CREATE TABLE IF NOT EXISTS public.ops_alerts (
  key text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('firing', 'ok')),
  title text NOT NULL,
  body text NOT NULL,
  first_fired_at timestamptz,
  last_notified_at timestamptz,
  notified_count integer NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ops_alerts IS
  'State of the production alerts checked every 15 minutes by check-ops-alerts. last_notified_at stays null until a push reached a phone, so an alert raised before any phone was registered is pushed once one is.';

ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins read ops alerts" ON public.ops_alerts;
CREATE POLICY "Superadmins read ops alerts"
  ON public.ops_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- 3a. The app registers its token after sign-in (and whenever FCM rotates
--     it). Returns true when the phone will receive alerts. For any other
--     role it stores nothing and removes the token if a superadmin had
--     registered it on the same phone before.
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

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'superadmin'
  ) THEN
    DELETE FROM public.push_devices WHERE token = p_token;
    RETURN false;
  END IF;

  INSERT INTO public.push_devices (token, user_id, platform)
  VALUES (p_token, _uid, p_platform)
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        last_seen_at = now();
  RETURN true;
END;
$$;

-- 3b. The app removes its token on sign-out.
CREATE OR REPLACE FUNCTION public.unregister_push_device(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.push_devices
  WHERE token = p_token AND user_id = auth.uid();
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon and authenticated explicitly; revoking from PUBLIC alone leaves them.
REVOKE ALL ON FUNCTION public.register_push_device(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unregister_push_device(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_push_device(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_push_device(text) TO authenticated;

-- 3c. What check-ops-alerts reads in one call. Definer rights because the
--     cron and net schemas aren't exposed to the API; service_role only.
CREATE OR REPLACE FUNCTION public.ops_alert_facts(p_window_minutes integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'rehearsal_sync', (
      SELECT jsonb_build_object(
        'started_at', l.started_at,
        'finished_at', l.finished_at,
        'status', l.status,
        'error_count', CASE WHEN jsonb_typeof(l.errors) = 'array'
                            THEN jsonb_array_length(l.errors) ELSE 0 END
      )
      FROM public.rehearsal_sync_logs l
      WHERE l.mode = 'cron'
      ORDER BY l.started_at DESC
      LIMIT 1
    ),
    'drive_sync', (
      SELECT jsonb_build_object(
        'started_at', r.started_at,
        'finished_at', r.finished_at,
        'status', r.status,
        'error', left(r.error, 200)
      )
      FROM public.drive_sync_runs r
      WHERE r.trigger = 'cron'
      ORDER BY r.started_at DESC
      LIMIT 1
    ),
    'cron_failures', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('jobname', f.jobname, 'failures', f.failures))
      FROM (
        SELECT j.jobname, count(*) AS failures
        FROM cron.job_run_details d
        JOIN cron.job j ON j.jobid = d.jobid
        WHERE d.status = 'failed'
          AND d.start_time > now() - make_interval(mins => p_window_minutes)
        GROUP BY j.jobname
        ORDER BY j.jobname
      ) f
    ), '[]'::jsonb),
    'http_failures', (
      SELECT jsonb_build_object(
        'count', count(*),
        'codes', COALESCE(to_jsonb(array_agg(DISTINCT
          CASE WHEN h.timed_out THEN 'timeout'
               WHEN h.status_code IS NULL THEN 'erreur'
               ELSE h.status_code::text END)), '[]'::jsonb)
      )
      FROM net._http_response h
      WHERE h.created > now() - make_interval(mins => p_window_minutes)
        AND (h.timed_out OR h.status_code IS NULL OR h.status_code >= 400)
    )
  );
$$;

REVOKE ALL ON FUNCTION public.ops_alert_facts(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ops_alert_facts(integer) TO service_role;

-- 4. Every 15 minutes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-ops-alerts') THEN
    PERFORM cron.unschedule('check-ops-alerts');
  END IF;
END;
$$;

SELECT cron.schedule(
  'check-ops-alerts',
  '7,22,37,52 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/check-ops-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);
