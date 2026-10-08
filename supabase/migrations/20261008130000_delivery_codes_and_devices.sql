-- Migration: delivery codes and the phones that follow a delivery in the app
-- Refs #593 (part 2)
--
-- Additive; safe before the code that uses it (installed apps keep working:
-- the code fills itself in when the driver's app adds a recipient).
--
-- 1. delivery_recipients.code: 8 characters from an alphabet without
--    look-alikes (no 0/O, 1/I/L), unique, filled by the database for every
--    recipient, existing ones included. Shown as XXXX-XXXX in the SMS and in
--    the link https://www.lebontemperament.com/l/<code>.
-- 2. delivery_devices: the phones a recipient linked to their delivery in
--    the app (no account), for the delivery-day pushes. At most 5 per
--    recipient. Only the edge functions read or write it.
-- 3. delivery_code_attempts: failed code attempts, keyed by an HMAC of the
--    caller's IP (never the IP itself), to cap guessing at 10 failures an
--    hour per caller. Kept 24 hours.
-- 4. redeem_delivery_code() and forget_delivery_device(), for the edge
--    function redeem-delivery-code (the app) and the website's /l/<code>
--    page (server side). Callable by the service role only.
-- 5. purge_expired_delivery_personal_data() (daily, 03:30 UTC) also erases
--    the devices of rounds whose tracking links have expired, and attempts
--    older than 24 hours.
--
-- Rollback:
--   re-run the function from 20261003100000_delivery_personal_data_retention.sql;
--   DROP FUNCTION public.redeem_delivery_code(text, text, text, text);
--   DROP FUNCTION public.forget_delivery_device(text, text);
--   DROP TABLE public.delivery_code_attempts;
--   DROP TABLE public.delivery_devices;
--   ALTER TABLE public.delivery_recipients DROP COLUMN code;
--   DROP FUNCTION public.new_delivery_code();

-- 1. Codes ------------------------------------------------------------------

-- 31 characters, 8 of them: about 850 billion codes. gen_random_uuid() is
-- the core strong random source (no extension needed); bytes 6 and 8 carry
-- the UUID version and variant bits and are skipped. A byte is used only
-- when below 248 (8 × 31), so every character is equally likely.
-- Runs as the column default for the driver (a superadmin, role
-- authenticated); SECURITY DEFINER so the uniqueness check sees every row.
CREATE OR REPLACE FUNCTION public.new_delivery_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  _bytes bytea;
  _byte int;
  _code text;
BEGIN
  LOOP
    _code := '';
    WHILE length(_code) < 8 LOOP
      _bytes := uuid_send(gen_random_uuid());
      FOR i IN 0..15 LOOP
        CONTINUE WHEN i IN (6, 8);
        _byte := get_byte(_bytes, i);
        CONTINUE WHEN _byte >= 248;
        _code := _code || substr(_alphabet, 1 + _byte % 31, 1);
        EXIT WHEN length(_code) = 8;
      END LOOP;
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.delivery_recipients WHERE code = _code
    );
  END LOOP;
  RETURN _code;
END;
$$;

REVOKE ALL ON FUNCTION public.new_delivery_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.new_delivery_code() TO authenticated, service_role;

ALTER TABLE public.delivery_recipients ADD COLUMN IF NOT EXISTS code text;

UPDATE public.delivery_recipients SET code = public.new_delivery_code()
 WHERE code IS NULL;

ALTER TABLE public.delivery_recipients
  ALTER COLUMN code SET DEFAULT public.new_delivery_code(),
  ALTER COLUMN code SET NOT NULL,
  ADD CONSTRAINT delivery_recipients_code_format
    CHECK (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$'),
  ADD CONSTRAINT delivery_recipients_code_key UNIQUE (code);

COMMENT ON COLUMN public.delivery_recipients.code IS
  'Personal code sent by SMS (shown XXXX-XXXX): opens the delivery in the app or at /l/<code>. Works while the round''s links are valid.';

-- 2. Devices -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.delivery_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL
    REFERENCES public.delivery_recipients (id) ON DELETE CASCADE,
  fcm_token text NOT NULL CHECK (length(fcm_token) BETWEEN 1 AND 4096),
  platform text CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id, fcm_token)
);

COMMENT ON TABLE public.delivery_devices IS
  'Phones following a delivery in the app, without an account (#593). Erased once the round''s links expire.';

ALTER TABLE public.delivery_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.delivery_devices FROM anon, authenticated;

-- 3. Attempts ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.delivery_code_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_key text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_code_attempts_client_idx
  ON public.delivery_code_attempts (client_key, attempted_at);

COMMENT ON TABLE public.delivery_code_attempts IS
  'Failed delivery code attempts, keyed by an HMAC of the caller''s IP (never the IP). Kept 24 hours.';

ALTER TABLE public.delivery_code_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.delivery_code_attempts FROM anon, authenticated;

-- 4. Redeeming and forgetting -------------------------------------------------

-- Returns {"status":"ok","recipient_id","tracking_token","label"}, or
-- {"status":"not_found"|"invalid"|"rate_limited"}. With a push token, links
-- that phone to the recipient (5 most recent phones kept).
CREATE OR REPLACE FUNCTION public.redeem_delivery_code(
  p_code text,
  p_client text,
  p_fcm_token text DEFAULT NULL,
  p_platform text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  _client text := left(coalesce(nullif(p_client, ''), 'unknown'), 128);
  _recipient record;
BEGIN
  IF (SELECT count(*) FROM delivery_code_attempts
       WHERE client_key = _client
         AND attempted_at > now() - interval '1 hour') >= 10 THEN
    RETURN jsonb_build_object('status', 'rate_limited');
  END IF;

  IF _code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$' THEN
    INSERT INTO delivery_code_attempts (client_key) VALUES (_client);
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT r.id, r.public_token, r.label
    INTO _recipient
    FROM delivery_recipients r
    JOIN deliveries d ON d.id = r.delivery_id
   WHERE r.code = _code
     AND d.expires_at > now();

  IF NOT FOUND THEN
    INSERT INTO delivery_code_attempts (client_key) VALUES (_client);
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF p_fcm_token IS NOT NULL AND length(p_fcm_token) BETWEEN 1 AND 4096 THEN
    INSERT INTO delivery_devices (recipient_id, fcm_token, platform)
    VALUES (
      _recipient.id,
      p_fcm_token,
      CASE WHEN p_platform IN ('ios', 'android') THEN p_platform END
    )
    ON CONFLICT (recipient_id, fcm_token)
      DO UPDATE SET created_at = now(), platform = EXCLUDED.platform;

    DELETE FROM delivery_devices
     WHERE recipient_id = _recipient.id
       AND id NOT IN (
         SELECT id FROM delivery_devices
          WHERE recipient_id = _recipient.id
          ORDER BY created_at DESC
          LIMIT 5
       );
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'recipient_id', _recipient.id,
    'tracking_token', _recipient.public_token,
    'label', _recipient.label
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_delivery_code(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_delivery_code(text, text, text, text)
  TO service_role;

-- The person removed the delivery from the app: that phone stops receiving
-- its pushes. The tracking token proves the caller holds the delivery.
CREATE OR REPLACE FUNCTION public.forget_delivery_device(
  p_tracking_token text,
  p_fcm_token text
)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM delivery_devices dd
   USING delivery_recipients r
   WHERE dd.recipient_id = r.id
     AND r.public_token = p_tracking_token
     AND dd.fcm_token = p_fcm_token;
$$;

REVOKE ALL ON FUNCTION public.forget_delivery_device(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.forget_delivery_device(text, text)
  TO service_role;

-- 5. Purge -------------------------------------------------------------------

-- Same as 20261003100000, plus devices and attempts.
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

  DELETE FROM delivery_devices dd
   USING delivery_recipients r, deliveries d
   WHERE dd.recipient_id = r.id
     AND r.delivery_id = d.id
     AND d.expires_at < now();

  DELETE FROM delivery_code_attempts
   WHERE attempted_at < now() - interval '24 hours';

  RETURN _recipients;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_delivery_personal_data() FROM PUBLIC, anon, authenticated;
