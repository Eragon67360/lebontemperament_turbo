DO $$
DECLARE
  tbl regclass;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'public.anniversary_hero'::regclass,
      'public.anniversary_navigation_cards'::regclass,
      'public.anniversary_timeline_events'::regclass,
      'public.anniversary_videos'::regclass,
      'public.anniversary_audio_memories'::regclass,
      'public.anniversary_photos'::regclass,
      'public.anniversary_form_config'::regclass,
      'public.anniversary_memories'::regclass
    ])
  LOOP
    -- Ensure replica identity first (idempotent)
    EXECUTE format('ALTER TABLE %s REPLICA IDENTITY FULL;', tbl);

    -- Add to publication only if missing
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = split_part(tbl::text, '.', 1)
        AND tablename = split_part(tbl::text, '.', 2)
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s;', tbl);
    END IF;
  END LOOP;
END $$;