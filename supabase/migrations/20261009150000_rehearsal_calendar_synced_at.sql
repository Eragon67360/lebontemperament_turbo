-- Calendar sync: tell a hand edit from a sync write (phase 2 of the write-back).
--
-- `calendar_synced_at` is when the sync last wrote or confirmed the row. The
-- table's update trigger sets `updated_at = now()` on every update, so inside
-- one sync statement both are equal; an admin who edits the row later (admin
-- panel) leaves `updated_at` after `calendar_synced_at`. The sync can then
-- write that edit's place, address and room into the Google event instead of
-- overwriting it from the calendar.
--
-- rehearsals_mark_calendar_synced() stamps rows whose edit the sync has just
-- written into Google (and stores the event's new `updated`, so the next run
-- does not treat our own write as a change made in Google). Quiet: no push.

ALTER TABLE public.rehearsals
  ADD COLUMN IF NOT EXISTS calendar_synced_at timestamptz;

COMMENT ON COLUMN public.rehearsals.calendar_synced_at IS 'Last time the calendar sync wrote or confirmed this row; updated_at later than this = edited by hand (calendar sync)';

-- Existing synced rows count as in sync: nothing is « edited by hand » yet.
-- Silent: this is bookkeeping, not a change members should hear about.
DO $$
BEGIN
  PERFORM set_config('app.silence_push', 'true', true);
  UPDATE public.rehearsals SET calendar_synced_at = now() WHERE event_id IS NOT NULL;
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
  v_old public.rehearsals%ROWTYPE;
  v_new_date date;
  v_new_start time;
  v_new_end time;
  v_new_group public.group_type;
  v_quiet boolean;
  v_prev text;
BEGIN
  IF p_silence_push THEN
    PERFORM set_config('app.silence_push', 'true', true);
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_upserts, '[]'::jsonb))
  LOOP
    SELECT * INTO v_old
    FROM public.rehearsals
    WHERE event_id = (v_row->>'event_id');

    IF NOT FOUND THEN
      INSERT INTO public.rehearsals (
        name,
        place,
        address,
        room,
        date,
        start_time,
        end_time,
        group_type,
        event_id,
        google_updated_at,
        calendar_synced_at
      )
      VALUES (
        v_row->>'name',
        v_row->>'place',
        NULLIF(v_row->>'address', ''),
        NULLIF(v_row->>'room', ''),
        (v_row->>'date')::date,
        (v_row->>'start_time')::time,
        (v_row->>'end_time')::time,
        (v_row->>'group_type')::group_type,
        v_row->>'event_id',
        (v_row->>'google_updated_at')::timestamptz,
        now()
      );

      v_created := v_created + 1;
    ELSE
      v_new_date := (v_row->>'date')::date;
      v_new_start := (v_row->>'start_time')::time;
      v_new_end := (v_row->>'end_time')::time;
      v_new_group := (v_row->>'group_type')::group_type;

      -- Quiet when nothing a member reads in the push changed.
      v_quiet :=
        v_old.name IS NOT DISTINCT FROM (v_row->>'name')
        AND v_old.place IS NOT DISTINCT FROM (v_row->>'place')
        AND v_old.date IS NOT DISTINCT FROM v_new_date
        AND v_old.start_time IS NOT DISTINCT FROM v_new_start
        AND v_old.end_time IS NOT DISTINCT FROM v_new_end
        AND v_old.group_type IS NOT DISTINCT FROM v_new_group;

      v_prev := current_setting('app.silence_push', true);
      IF v_quiet THEN
        PERFORM set_config('app.silence_push', 'true', true);
      END IF;

      UPDATE public.rehearsals
      SET name = v_row->>'name',
          place = v_row->>'place',
          address = NULLIF(v_row->>'address', ''),
          room = NULLIF(v_row->>'room', ''),
          date = v_new_date,
          start_time = v_new_start,
          end_time = v_new_end,
          group_type = v_new_group,
          google_updated_at = (v_row->>'google_updated_at')::timestamptz,
          calendar_synced_at = now(),
          updated_at = now()
      WHERE id = v_old.id;

      -- Back to what the call started with, for the rows that follow.
      PERFORM set_config('app.silence_push', COALESCE(v_prev, ''), true);

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

-- Same privileges as before (#452): the calendar-sync edge function only.
REVOKE ALL ON FUNCTION public.rehearsals_sync_write(jsonb, uuid[], boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rehearsals_sync_write(jsonb, uuid[], boolean)
  TO service_role;

CREATE OR REPLACE FUNCTION public.rehearsals_mark_calendar_synced(p_marks jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.silence_push', 'true', true);

  UPDATE public.rehearsals r
     SET calendar_synced_at = now(),
         google_updated_at = COALESCE((m->>'google_updated_at')::timestamptz, r.google_updated_at)
    FROM jsonb_array_elements(COALESCE(p_marks, '[]'::jsonb)) AS m
   WHERE r.event_id = m->>'event_id';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rehearsals_mark_calendar_synced(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rehearsals_mark_calendar_synced(jsonb)
  TO service_role;
