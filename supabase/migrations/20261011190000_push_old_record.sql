-- Migration: rehearsal pushes also reach the group a rehearsal leaves
--
-- send-push-notification now sends a rehearsal's push only to the members of
-- its group (topics `rehearsals_<group>`, apps after 2.0.142; older apps still
-- receive everything through `all_users`). When an UPDATE moves a rehearsal
-- to another group, the members of the former group must hear about it too,
-- so the trigger now adds the row as it was (`old_record`) on UPDATE.
--
-- Changed: notify_push_notification(), same body as
-- 20261008223000_edge_function_key_headers.sql plus `old_record` on UPDATE.
-- Safe in any order with the function deploy: the function reads
-- `old_record` only when it is there, and an older function ignores it.
--
-- Rollback: re-run notify_push_notification() from
-- 20261008223000_edge_function_key_headers.sql.

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
  IF _op = 'UPDATE' THEN
    _body := _body || jsonb_build_object('old_record', to_jsonb(OLD));
  END IF;

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
