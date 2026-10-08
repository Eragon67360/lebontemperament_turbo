-- Migration: concert pushes for the public part of the app (#593)
--
-- Visitors of the app (nobody signed in) listen to the FCM topic
-- `public_concerts` while their « Prochains concerts » switch is on. Nothing
-- about them is stored. Each concert gets two pushes on that topic, sent by
-- the edge function notify-public-concerts once a day:
--   - the announcement, at the first run after the concert is created (when
--     it is more than two days away);
--   - a reminder when the concert is two days away (or one, for a concert
--     created at the last minute).
--
-- Additive:
--   1. public_concert_pushes: which push went out for which concert, so each
--      is sent once. Service role only (RLS on, no policy).
--   2. Every concert already in the table counts as announced: the first run
--      must not announce the whole season at once. Their reminders still go
--      out.
--   3. Cron job notify-public-concerts, every day at 16:00 UTC (18:00 in
--      Paris in summer, 17:00 in winter), scheduled only where the Vault
--      secrets project_url, anon_key and internal_function_secret exist
--      (production; staging has no cron and no functions).
--
-- Prerequisite for the pushes: deploy supabase/functions/notify-public-concerts.
-- Applying this before the function exists is harmless: pg_net records a 404.
--
-- Rollback:
--   SELECT cron.unschedule('notify-public-concerts');
--   DROP TABLE public.public_concert_pushes;

-- 1. What went out.
CREATE TABLE IF NOT EXISTS public.public_concert_pushes (
  concert_id uuid NOT NULL REFERENCES public.concerts (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('announcement', 'reminder')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (concert_id, kind)
);

COMMENT ON TABLE public.public_concert_pushes IS
  'Concert pushes sent to the public FCM topic public_concerts (#593): one announcement and one reminder per concert at most. Written and read by the edge function notify-public-concerts with the service role.';

ALTER TABLE public.public_concert_pushes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.public_concert_pushes FROM anon, authenticated;

-- 2. The concerts that exist today are not news.
INSERT INTO public.public_concert_pushes (concert_id, kind)
SELECT id, 'announcement' FROM public.concerts
ON CONFLICT DO NOTHING;

-- 3. Once a day, where the function can be called.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-public-concerts') THEN
    PERFORM cron.unschedule('notify-public-concerts');
  END IF;

  IF (SELECT count(*) FROM vault.decrypted_secrets
      WHERE name IN ('project_url', 'anon_key', 'internal_function_secret')) < 3 THEN
    RAISE NOTICE 'Vault secrets missing (staging?): notify-public-concerts not scheduled';
    RETURN;
  END IF;

  PERFORM cron.schedule(
    'notify-public-concerts',
    '0 16 * * *',
    $job$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
             || '/functions/v1/notify-public-concerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
        'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) AS request_id;
    $job$
  );
END;
$$;
