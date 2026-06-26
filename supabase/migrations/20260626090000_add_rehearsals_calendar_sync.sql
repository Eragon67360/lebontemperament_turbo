-- Migration: Add Google Calendar sync support for rehearsals
-- Description:
--   - Adds nullable Calendar join metadata to public.rehearsals.
--   - Adds run-level observability for automated syncs.
--   - Allows controlled push-notification silencing during test/backfill runs.
--   - Adds a SECURITY DEFINER RPC used by the Edge Function for atomic writes.

ALTER TABLE public.rehearsals
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS google_updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS rehearsals_event_id_unique
  ON public.rehearsals (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS rehearsals_event_id_date_idx
  ON public.rehearsals (event_id, date)
  WHERE event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.rehearsal_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  mode text NOT NULL DEFAULT 'cron' CHECK (mode IN ('cron', 'test', 'dry-run')),
  status text NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
  events_fetched int DEFAULT 0,
  created int DEFAULT 0,
  updated int DEFAULT 0,
  deleted int DEFAULT 0,
  skipped int DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.rehearsal_sync_logs ENABLE ROW LEVEL SECURITY;

-- Preserve the existing push-notification trigger body and prepend only the
-- transaction-local guard used by rehearsals_sync_write().
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
  IF current_setting('app.silence_push', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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

CREATE OR REPLACE FUNCTION public.rehearsals_sync_write(
  p_upserts jsonb,
  p_delete_ids uuid[],
  p_silence_push boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created int := 0;
  v_updated int := 0;
  v_deleted int := 0;
  v_row jsonb;
  v_existing_id uuid;
BEGIN
  IF p_silence_push THEN
    PERFORM set_config('app.silence_push', 'true', true);
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_upserts, '[]'::jsonb))
  LOOP
    SELECT id INTO v_existing_id
    FROM public.rehearsals
    WHERE event_id = (v_row->>'event_id');

    IF v_existing_id IS NULL THEN
      INSERT INTO public.rehearsals (
        name,
        place,
        date,
        start_time,
        end_time,
        group_type,
        event_id,
        google_updated_at
      )
      VALUES (
        v_row->>'name',
        v_row->>'place',
        (v_row->>'date')::date,
        (v_row->>'start_time')::time,
        (v_row->>'end_time')::time,
        (v_row->>'group_type')::group_type,
        v_row->>'event_id',
        (v_row->>'google_updated_at')::timestamptz
      );

      v_created := v_created + 1;
    ELSE
      UPDATE public.rehearsals
      SET name = v_row->>'name',
          place = v_row->>'place',
          date = (v_row->>'date')::date,
          start_time = (v_row->>'start_time')::time,
          end_time = (v_row->>'end_time')::time,
          group_type = (v_row->>'group_type')::group_type,
          google_updated_at = (v_row->>'google_updated_at')::timestamptz,
          updated_at = now()
      WHERE id = v_existing_id;

      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  IF p_delete_ids IS NOT NULL AND array_length(p_delete_ids, 1) > 0 THEN
    DELETE FROM public.rehearsals
    WHERE id = ANY(p_delete_ids)
      AND event_id IS NOT NULL;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'created', v_created,
    'updated', v_updated,
    'deleted', v_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rehearsals_sync_write(jsonb, uuid[], boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.rehearsals_sync_write(jsonb, uuid[], boolean) TO service_role;
