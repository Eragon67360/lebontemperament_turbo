-- Rehearsal address and room (calendar sync).
--
-- « Itinéraire » in the app searched the free-text `place`, which the admins
-- often fill with just the village (« Nordheim »): the map opened on the middle
-- of the village. The sync now also stores:
--   - address: the complete postal address handed to the maps app;
--   - room:    the room inside the building (« Salle 12 » at the
--              Conservatoire), shown with the rehearsal, never sent to maps.
-- Both are optional; `place` keeps its meaning (the short name members read),
-- so apps that do not know the columns behave as before.
--
-- rehearsals_sync_write() also stops notifying members when a sync changes
-- only fields they do not see in the push (address, room, or nothing): filling
-- the address of every future rehearsal must not send « Répétition modifiée »
-- to everyone. A change to name, place, date, hours or group still notifies.

ALTER TABLE public.rehearsals
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS room text;

COMMENT ON COLUMN public.rehearsals.address IS 'Complete postal address for the maps app; null = search the place (calendar sync)';
COMMENT ON COLUMN public.rehearsals.room IS 'Room inside the building, e.g. « Salle 12 »; never sent to the maps app (calendar sync)';

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
        google_updated_at
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
        (v_row->>'google_updated_at')::timestamptz
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
