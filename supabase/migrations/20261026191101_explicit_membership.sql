-- Audit 2026-10-26 (SEC-006): members are created explicitly by the admin.
-- A member is an account with a public.profiles row. From this migration on,
-- only the admin's server code writes that row; the database no longer adds
-- one for every new auth user.
--
-- Before (production, from the 2026-10-07 dump in supabase/staging; the
-- trigger was checked enabled in production on 2026-10-26):
--   trigger on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW
--     EXECUTE FUNCTION public.handle_new_user()
--   function public.handle_new_user() RETURNS trigger, LANGUAGE plpgsql,
--   SECURITY DEFINER, no search_path setting, EXECUTE granted to anon,
--   authenticated and service_role:
--     BEGIN
--       INSERT INTO public.profiles (id, email, role, display_name)
--       VALUES (new.id, new.email, 'user', COALESCE(
--           (new.raw_user_meta_data->>'display_name')::text,
--           split_part(new.email, '@', 1)
--         ));
--       RETURN new;
--     END;
--   Every new auth user received a profile with role `user`.
--
-- After:
--   handle_new_user() returns the new row and adds nothing. The trigger
--   stays, so rolling back is this one function. The admin writes the
--   profile with the service role right after it creates the account:
--   « Créer un compte » (POST /api/users, with the role chosen there) and
--   every invitation (POST /api/invite-users and the roster sync's apply,
--   role `user`). Those writes only add a missing row and never change an
--   existing one. An account made any other way (the Supabase dashboard,
--   the Auth API) has no profile until one is added (supabase/staging/
--   README.md, test accounts): the website's sign-in signs it out and the
--   admin refuses it.
--   Existing accounts and profiles are not touched. CREATE OR REPLACE keeps
--   the owner and the grants; SECURITY DEFINER is kept; search_path is now
--   pinned (empty), the body naming no object.
--
-- Why no flag (a profile only when raw_app_meta_data->>'lbt_member' = 'true',
-- set by the admin's createUser): an invitation cannot set app_metadata when
-- Supabase inserts the account, and invited_at is written by a later UPDATE,
-- so the admin's code has to write an invited member's profile anyway. One
-- place that creates members is simpler to check than two, and there is no
-- flag in app_metadata (copied into every access token) to keep in step with
-- the profiles table.
--
-- Order: the code of the same pull request (the admin writes the profile
-- with the account and with each invitation; the website refuses anonymous
-- sessions and signs out a session without a profile) must be live first.
-- Applied before that code, accounts created or invited from the admin get
-- no profile and cannot sign in. Apply to website-staging, check, then
-- production.
--
-- Check, before and after (after: prosrc has no INSERT, prosecdef true,
-- proconfig {search_path=""}, same owner; the trigger still 'O', enabled):
--   select p.prosrc, p.prosecdef, p.proconfig, p.proowner::regrole
--     from pg_proc p where p.oid = 'public.handle_new_user()'::regprocedure;
--   select tgenabled from pg_trigger
--    where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass;
--
-- Rollback (every new auth user gets a profile again; the admin's code works
-- either way, since it only adds a missing row):
--   create or replace function public.handle_new_user() returns trigger
--   language plpgsql security definer as $$BEGIN
--     INSERT INTO public.profiles (id, email, role, display_name)
--     VALUES (new.id, new.email, 'user', COALESCE(
--         (new.raw_user_meta_data->>'display_name')::text,
--         split_part(new.email, '@', 1)
--       ));
--     RETURN new;
--   END;$$;

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Members are created by the admin (audit SEC-006): its server code writes
  -- the profile with the account or the invitation. Nothing to add here.
  return new;
end;
$$;

commit;
