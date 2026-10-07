-- Migration: event data for Google on concerts (#328)
--
-- Additive only. Optional columns that the website's MusicEvent JSON-LD
-- (apps/website/app/concerts) reads, filled by the edge function
-- `generate-concert-event-data` with AI when an admin creates or edits a
-- concert (owner decision, 2026-10-06). Every column is nullable: a concert
-- without them renders as before, with the address parsed from `place`.
--
-- The function writes through `concert_event_data_write`, which silences the
-- push trigger for its own transaction: without it, every AI fill would send
-- members a « Concert modifié » notification right after « Nouveau concert
-- ajouté » (`concerts_push_notification` fires on every UPDATE).
--
-- `public.concerts` before this migration (read 2026-10-06, no migration
-- history for the table):
--   columns: id uuid PK default gen_random_uuid(), created_at, updated_at
--   timestamptz default now(), place text not null, date date not null,
--   time time not null, context text not null, additional_informations text,
--   name text, created_by uuid, affiche text, tour_id uuid (FK tours),
--   related_link text
--   policies: SELECT for public (true); INSERT/UPDATE/DELETE for
--   authenticated admins and superadmins (profiles.role)
--   triggers: concerts_push_notification (AFTER INSERT/UPDATE/DELETE,
--   notify_push_notification), update_concerts_updated_at (BEFORE UPDATE)
--
-- The SELECT policy already covers the new columns (public data, as on the
-- posters). The admin routes whitelist the columns they write (#489) and
-- don't list these, so only the function fills them.
--
-- Rollback:
--   DROP FUNCTION public.concert_event_data_write(uuid, text, text, text, text, text, boolean, numeric);
--   ALTER TABLE public.concerts
--     DROP COLUMN venue_name, DROP COLUMN street_address,
--     DROP COLUMN postal_code, DROP COLUMN city, DROP COLUMN country,
--     DROP COLUMN is_free, DROP COLUMN price,
--     DROP COLUMN event_data_generated_at;

ALTER TABLE public.concerts
  ADD COLUMN IF NOT EXISTS venue_name text,
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS is_free boolean,
  ADD COLUMN IF NOT EXISTS price numeric(8, 2),
  ADD COLUMN IF NOT EXISTS event_data_generated_at timestamptz;

-- Re-runnable: the constraints are added only when missing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'concerts_country_iso2') THEN
    ALTER TABLE public.concerts
      ADD CONSTRAINT concerts_country_iso2 CHECK (country IS NULL OR country ~ '^[A-Z]{2}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'concerts_price_range') THEN
    ALTER TABLE public.concerts
      ADD CONSTRAINT concerts_price_range CHECK (price IS NULL OR (price >= 0 AND price <= 1000));
  END IF;
END;
$$;

COMMENT ON COLUMN public.concerts.venue_name IS 'Venue name without the city (AI, #328)';
COMMENT ON COLUMN public.concerts.street_address IS 'Street and number, only when stated in the inputs (AI, #328)';
COMMENT ON COLUMN public.concerts.postal_code IS 'Postal code (AI, #328)';
COMMENT ON COLUMN public.concerts.city IS 'Town of the venue (AI, #328)';
COMMENT ON COLUMN public.concerts.country IS 'ISO 3166-1 alpha-2 country code (AI, #328)';
COMMENT ON COLUMN public.concerts.is_free IS 'true: free entry or donation box; false: paid; null: unknown (AI, #328)';
COMMENT ON COLUMN public.concerts.price IS 'Full adult price in euros when paid (AI, #328)';
COMMENT ON COLUMN public.concerts.event_data_generated_at IS 'When generate-concert-event-data last filled the columns above';

-- Writes the event columns of one concert without notifying members.
-- service_role only: the edge function calls it with the service key.
CREATE OR REPLACE FUNCTION public.concert_event_data_write(
  p_id uuid,
  p_venue_name text,
  p_street_address text,
  p_postal_code text,
  p_city text,
  p_country text,
  p_is_free boolean,
  p_price numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Local to this transaction: notify_push_notification() returns early.
  PERFORM set_config('app.silence_push', 'true', true);

  UPDATE public.concerts
  SET venue_name = p_venue_name,
      street_address = p_street_address,
      postal_code = p_postal_code,
      city = p_city,
      country = p_country,
      is_free = p_is_free,
      price = p_price,
      event_data_generated_at = now()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.concert_event_data_write(uuid, text, text, text, text, text, boolean, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.concert_event_data_write(uuid, text, text, text, text, text, boolean, numeric)
  TO service_role;
