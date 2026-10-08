-- Migration: database calls to edge functions work with the new API keys
-- Refs #570
--
-- The push triggers and the cron jobs call edge functions with
-- `Authorization: Bearer <Vault anon_key>`. That only works while `anon_key`
-- holds the legacy anon key (a JWT): the publishable key (`sb_publishable_…`)
-- isn't a JWT, and Supabase refuses it on `Authorization`.
--
-- From now on they take their key headers from `edge_function_auth_headers()`:
--   - `anon_key` is a JWT (legacy): `apikey` and `Authorization: Bearer`, so
--     nothing changes for functions that still have the gateway's JWT check;
--   - `anon_key` is a publishable key: `apikey` only, for functions deployed
--     with `verify_jwt = false` (each checks `x-internal-secret` itself).
-- Applying this migration changes no behaviour until the Vault secret
-- `anon_key` is switched to the publishable key, which comes after the
-- functions are redeployed. The functions never read these key headers.
--
-- Changed:
--   1. new function edge_function_auth_headers() (postgres only);
--   2. notify_push_notification() and notify_bug_report_push(): same bodies
--      as 20261002100000 and 20261008090000, key headers from the helper;
--   3. every cron job whose command sends the Vault `anon_key` as a Bearer
--      token (check-eta-arrival-sms, sync-rehearsals-from-calendar,
--      sync-drive-index, check-ops-alerts, purge-bug-screenshots,
--      notify-public-concerts): only that header is rewritten, in place, so
--      schedules, guards, bodies and other headers stay exactly as they are.
--      The migration stops if a job still sends it afterwards.
--
-- Rollback (behaviour is unchanged while `anon_key` holds the legacy key, so
-- first put the legacy anon key back in Vault if it was switched):
--   re-run notify_push_notification() from
--   20261002100000_internal_function_secret_and_tracking_rpc.sql and
--   notify_bug_report_push() from 20261008090000_app_bug_reports.sql, then
--   DO $$ DECLARE j record; BEGIN
--     FOR j IN SELECT jobid, command FROM cron.job
--       WHERE command LIKE '%public.edge_function_auth_headers() || %' LOOP
--       PERFORM cron.alter_job(j.jobid, command := replace(j.command,
--         'public.edge_function_auth_headers() || jsonb_build_object(',
--         'jsonb_build_object(''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''anon_key''), '));
--     END LOOP; END $$;
--   then DROP FUNCTION public.edge_function_auth_headers();

-- 1. Key headers for calls from the database to edge functions.
CREATE OR REPLACE FUNCTION public.edge_function_auth_headers()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN k.key IS NULL OR k.key = '' THEN '{}'::jsonb
    -- Legacy keys are JWTs (three base64url parts, header starting `eyJ`).
    WHEN k.key LIKE 'eyJ%.%.%' THEN
      jsonb_build_object('apikey', k.key, 'Authorization', 'Bearer ' || k.key)
    ELSE jsonb_build_object('apikey', k.key)
  END
  FROM (
    SELECT (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key') AS key
  ) AS k;
$$;

REVOKE ALL ON FUNCTION public.edge_function_auth_headers() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.edge_function_auth_headers() IS
  'Key headers for pg_net calls to edge functions (#570): apikey from the Vault secret anon_key, plus Authorization: Bearer only while that key is a legacy JWT. Called by the push triggers and cron jobs, which run as postgres.';

-- 2a. Push-notification trigger: same body as 20261002100000, key headers from the helper.
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
    headers := public.edge_function_auth_headers() || jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _secret
    ),
    body := _body,
    timeout_milliseconds := 15000
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2b. Bug-report push: same body as 20261008090000, key headers from the helper.
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
    headers := public.edge_function_auth_headers() || jsonb_build_object(
      'Content-Type', 'application/json',
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

-- 3. Cron jobs: drop the Bearer header, merge the helper's headers in.
DO $$
DECLARE
  _bearer constant text :=
    '''Authorization'',\s*''Bearer ''\s*\|\|\s*\(SELECT decrypted_secret FROM vault\.decrypted_secrets WHERE name = ''anon_key''\)\s*,\s*';
  _job record;
  _command text;
BEGIN
  FOR _job IN
    SELECT jobid, jobname, command FROM cron.job
    WHERE command ~ _bearer
  LOOP
    _command := regexp_replace(_job.command, _bearer, '', 'g');
    _command := replace(
      _command,
      'headers := jsonb_build_object(',
      'headers := public.edge_function_auth_headers() || jsonb_build_object('
    );
    PERFORM cron.alter_job(_job.jobid, command := _command);
    RAISE NOTICE 'cron job % now takes its key headers from edge_function_auth_headers()', _job.jobname;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE command LIKE '%''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''anon_key'')%'
  ) THEN
    RAISE EXCEPTION 'A cron job still sends the Vault anon_key as a Bearer token: check cron.job by hand';
  END IF;
END;
$$;

-- Checks: nobody but postgres runs the helper.
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.edge_function_auth_headers()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.edge_function_auth_headers()', 'EXECUTE') THEN
    RAISE EXCEPTION 'edge_function_auth_headers() must not be executable by anon or authenticated';
  END IF;
END;
$$;
