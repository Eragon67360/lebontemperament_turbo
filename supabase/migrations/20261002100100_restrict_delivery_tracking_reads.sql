-- Migration: delivery tables readable only by the driver (superadmin)
-- Refs #311
--
-- Part 2 of 2. Apply ONLY after the website release whose /track page reads
-- through get_tracking_by_recipient_token() (part 1) is live in production:
-- the previous /track code reads the tables directly and would stop working.
--
-- Removes the read policies that let any holder of the public anon key, and
-- any signed-in member, read every non-expired delivery and recipient.
-- Kept: "Superadmins can manage all deliveries" / "... delivery_recipients"
-- (the driver's app flow), get_delivery_by_token() (token-checked),
-- get_tracking_by_recipient_token() (part 1).
--
-- Check after applying (expected: only the two superadmin policies):
--   select tablename, policyname, roles, cmd from pg_policies
--   where tablename in ('deliveries', 'delivery_recipients');
--
-- Rollback (re-opens the exposure, emergency only): recreate the four
-- policies from 20250129000000, 20250131000000 and 20250601000000 and
-- `GRANT SELECT ON deliveries, delivery_recipients TO anon;`.

DROP POLICY IF EXISTS "Clients can read non-expired deliveries" ON deliveries;
DROP POLICY IF EXISTS "Authenticated can read non-expired deliveries" ON deliveries;
DROP POLICY IF EXISTS "Clients can read non-expired delivery_recipients" ON delivery_recipients;
DROP POLICY IF EXISTS "Authenticated can read non-expired delivery_recipients" ON delivery_recipients;

REVOKE SELECT ON deliveries FROM anon;
REVOKE SELECT ON delivery_recipients FROM anon;
