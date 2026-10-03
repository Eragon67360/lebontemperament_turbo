-- Migration: delivery rounds' personal data removed 30 days after the round
-- Refs #352 (owner decision 10: 30 days)
--
-- Thirty days after a round's tracking links expire, its recipients' personal
-- data is removed: name (replaced by a neutral label, the column is NOT NULL),
-- address, phone number and coordinates. The rows stay, so the round's history
-- (number of stops, order, delivery times) remains for the driver's app.
-- The driver's last known position is cleared as soon as the links expire.
-- Runs daily at 03:30 UTC through pg_cron.
--
-- First run: every round older than 30 days is anonymised at once (on
-- 2026-10-03: all existing rounds, the last link expired on 2026-02-22).
-- Apply only after the owner has confirmed nothing needs to be kept or
-- exported first.
--
-- Rollback: `SELECT cron.unschedule('purge-delivery-personal-data');` and
-- `DROP FUNCTION public.purge_expired_delivery_personal_data();`. Removed
-- data can't be restored (except from a database backup).

CREATE OR REPLACE FUNCTION public.purge_expired_delivery_personal_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recipients integer;
BEGIN
  UPDATE delivery_recipients r
     SET label = 'Destinataire',
         address = NULL,
         phone_number = NULL,
         latitude = NULL,
         longitude = NULL
    FROM deliveries d
   WHERE r.delivery_id = d.id
     AND d.expires_at < now() - interval '30 days'
     AND (r.label <> 'Destinataire'
          OR r.address IS NOT NULL
          OR r.phone_number IS NOT NULL
          OR r.latitude IS NOT NULL
          OR r.longitude IS NOT NULL);
  GET DIAGNOSTICS _recipients = ROW_COUNT;

  UPDATE deliveries
     SET latitude = NULL,
         longitude = NULL
   WHERE expires_at < now()
     AND (latitude IS NOT NULL OR longitude IS NOT NULL);

  RETURN _recipients;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_delivery_personal_data() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-delivery-personal-data') THEN
    PERFORM cron.unschedule('purge-delivery-personal-data');
  END IF;
END;
$$;

SELECT cron.schedule(
  'purge-delivery-personal-data',
  '30 3 * * *',
  $$ SELECT public.purge_expired_delivery_personal_data(); $$
);
