-- Migration: comparison between the member roster and the mailing lists
--
-- Additive only (two new tables):
--   1. mailing_list_comparisons: one row per Google Group an admin compares
--      with the member roster, with the result of its latest comparison
--      (counts only, never addresses). The admin's « Liste de diffusion »
--      page writes it on every comparison, the weekly Vercel cron of the
--      admin (/api/cron/mailing-list-comparison) once a week, and
--      check-ops-alerts reads it to push the superadmins when a list drifts.
--   2. mailing_list_exceptions: addresses admins chose to keep on a list
--      without being in the roster, or to leave off a list although they are
--      in it (stored as the comparison's match key).
--
-- Both tables are read and written only by the admin's server routes and by
-- edge functions, with the service role: RLS on, no policy, no grant to
-- anon or authenticated.
--
-- Which list is compared is data, not code (the repository is public):
-- enable it in the admin, or insert its row by hand.
--
-- Rollback:
--   DROP TABLE public.mailing_list_exceptions;
--   DROP TABLE public.mailing_list_comparisons;

CREATE TABLE IF NOT EXISTS public.mailing_list_comparisons (
  group_email text PRIMARY KEY CHECK (group_email = lower(btrim(group_email)) AND group_email LIKE '%@%'),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  checked_at timestamptz,
  cron_checked_at timestamptz,
  status text CHECK (status IN ('ok', 'failed')),
  missing_count integer NOT NULL DEFAULT 0 CHECK (missing_count >= 0),
  extra_count integer NOT NULL DEFAULT 0 CHECK (extra_count >= 0),
  error text CHECK (char_length(error) <= 500)
);

COMMENT ON TABLE public.mailing_list_comparisons IS
  'Google Groups compared with the member roster, and the result of their latest comparison (counts only). Written by the admin''s server routes and its weekly cron; read by check-ops-alerts.';

ALTER TABLE public.mailing_list_comparisons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mailing_list_comparisons FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.mailing_list_exceptions (
  group_email text NOT NULL REFERENCES public.mailing_list_comparisons (group_email) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email LIKE '%@%' AND char_length(email) <= 320),
  note text CHECK (char_length(note) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (group_email, email)
);

COMMENT ON TABLE public.mailing_list_exceptions IS
  'Addresses kept on purpose out of a list''s comparison with the member roster (on the list without being in the roster, or the reverse). email is the comparison''s match key.';

ALTER TABLE public.mailing_list_exceptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mailing_list_exceptions FROM anon, authenticated;
