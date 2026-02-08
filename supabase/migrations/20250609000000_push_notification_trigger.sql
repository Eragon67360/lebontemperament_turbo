-- Migration: Call send-push-notification Edge Function on rehearsals/events/concerts changes
-- Description: On INSERT/UPDATE/DELETE on rehearsals, events, concerts, invokes the Edge Function
--   which sends FCM to topic "all_users" for the mobile app.
--
-- Prerequisites (same as cron): vault secrets project_url and anon_key.
-- Edge Function secret: FIREBASE_SERVICE_ACCOUNT_JSON (Firebase service account JSON string).

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper: invoke send-push-notification Edge Function
CREATE OR REPLACE FUNCTION public.notify_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _key text;
  _body jsonb;
  _row jsonb;
  _op text;
BEGIN
  SELECT decrypted_secret INTO _url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'anon_key';
  IF _url IS NULL OR _key IS NULL THEN
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
      'Authorization', 'Bearer ' || _key
    ),
    body := _body,
    timeout_milliseconds := 15000
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers: rehearsals, events, concerts
CREATE TRIGGER rehearsals_push_notification
  AFTER INSERT OR UPDATE OR DELETE ON public.rehearsals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();

CREATE TRIGGER events_push_notification
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();

CREATE TRIGGER concerts_push_notification
  AFTER INSERT OR UPDATE OR DELETE ON public.concerts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_notification();
