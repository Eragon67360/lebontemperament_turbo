-- Migration: delivery invitations sent ahead of delivery day
-- Refs #593 (part 3)
--
-- Additive; safe before the code that uses it.
--
-- 1. delivery_recipients.invited_at: when the invitation SMS (date, link,
--    code) went out, set by the edge function send-delivery-invitations. Null
--    until then; the driver's app shows it and re-sends on demand.
-- 2. Links now last until the day after delivery. Invitations go out 1 to 2
--    weeks before delivery day, but the app creates rounds with expires_at =
--    now + 24 h. A trigger pushes expires_at to at least one day after the
--    delivery window (scheduled_end_at, else scheduled_at) whenever a round is
--    written with a date; it never shortens it. The 30-day purge of personal
--    data still counts from expires_at.
--
-- Rollback:
--   DROP TRIGGER deliveries_links_last_until_after_delivery ON public.deliveries;
--   DROP FUNCTION public.deliveries_links_last_until_after_delivery();
--   ALTER TABLE public.delivery_recipients DROP COLUMN invited_at;

-- 1. Invitations ---------------------------------------------------------------

ALTER TABLE public.delivery_recipients
  ADD COLUMN IF NOT EXISTS invited_at timestamptz;

COMMENT ON COLUMN public.delivery_recipients.invited_at IS
  'When the invitation SMS (delivery date, link /l/<code>, code) was sent. Null until then.';

-- 2. Expiry --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deliveries_links_last_until_after_delivery()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _delivery_day timestamptz := coalesce(NEW.scheduled_end_at, NEW.scheduled_at);
BEGIN
  IF _delivery_day IS NOT NULL THEN
    NEW.expires_at := greatest(NEW.expires_at, _delivery_day + interval '1 day');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.deliveries_links_last_until_after_delivery()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS deliveries_links_last_until_after_delivery
  ON public.deliveries;
CREATE TRIGGER deliveries_links_last_until_after_delivery
  BEFORE INSERT OR UPDATE OF scheduled_at, scheduled_end_at, expires_at
  ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.deliveries_links_last_until_after_delivery();

-- Rounds already planned get the same rule.
UPDATE public.deliveries
   SET expires_at = coalesce(scheduled_end_at, scheduled_at) + interval '1 day'
 WHERE coalesce(scheduled_end_at, scheduled_at) + interval '1 day' > expires_at;
