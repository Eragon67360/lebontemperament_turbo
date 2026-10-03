-- Migration: delivery tables readable only by the driver (superadmin)
-- Refs #311
--
-- Part 2 of 2. Apply ONLY after the website release whose /track page reads
-- through get_tracking_by_recipient_token() (part 1) is live in production:
-- the previous /track code reads the tables directly and would stop working.
--
-- Removes the read policies that let any holder of the public anon key, and
-- any signed-in member, read deliveries and recipients. Measured on production
-- on 2026-10-03 (the policies differ from this repository's migrations): both
-- tables also had "Enable read access for all users" (role public, USING
-- true: every round and recipient readable with the anon key, expired or not)
-- and delivery_recipients had "Clients can read recipients via realtime
-- token" (anon). Both are dropped here too.
-- Kept: "Superadmins can manage all deliveries" / "... delivery_recipients"
-- (the driver's app flow) and get_tracking_by_recipient_token() (part 1).
-- Also revokes the unused get_delivery_by_token() from visitors and members
-- (nothing calls it; it returned the driver's id and the round-level token).
--
-- Check after applying (expected: only the two superadmin policies):
--   select tablename, policyname, roles, cmd from pg_policies
--   where tablename in ('deliveries', 'delivery_recipients');
--
-- Rollback (re-opens the exposure, emergency only): recreate the four
-- policies from 20250129000000, 20250131000000 and 20250601000000 (the three
-- production-only ones are not worth restoring) and
-- `GRANT SELECT ON deliveries, delivery_recipients TO anon;`, and
-- `GRANT EXECUTE ON FUNCTION get_delivery_by_token(TEXT) TO anon;`.

DROP POLICY IF EXISTS "Clients can read non-expired deliveries" ON deliveries;
DROP POLICY IF EXISTS "Authenticated can read non-expired deliveries" ON deliveries;
DROP POLICY IF EXISTS "Clients can read non-expired delivery_recipients" ON delivery_recipients;
DROP POLICY IF EXISTS "Authenticated can read non-expired delivery_recipients" ON delivery_recipients;
DROP POLICY IF EXISTS "Enable read access for all users" ON deliveries;
DROP POLICY IF EXISTS "Enable read access for all users" ON delivery_recipients;
DROP POLICY IF EXISTS "Clients can read recipients via realtime token" ON delivery_recipients;

REVOKE SELECT ON deliveries FROM anon;
REVOKE SELECT ON delivery_recipients FROM anon;

REVOKE EXECUTE ON FUNCTION get_delivery_by_token(TEXT) FROM PUBLIC, anon, authenticated;
