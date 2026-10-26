-- Audit 2026-10-26 (SEC-014): the members directory and the admin's members
-- list keep an account's avatar only when it is a Google account picture.
--
-- member_directory_with_avatars() (signed-in members: the website's
-- directory) and auth_user_summaries() (service role: the admin's server
-- routes) return the `avatar_url` kept in the account's metadata. The sign-in
-- that fills it is Google's, with an https URL on a googleusercontent.com
-- subdomain (lh3.googleusercontent.com); Apple sign-in gives none, and the
-- photos members upload are in profiles.profile_picture_url, returned
-- unchanged. Both functions now return that avatar only when it is such a URL,
-- and NULL otherwise: the sites then show the profile photo or the initials.
-- The website and the admin apply the same pattern in code
-- (packages/domain/src/utils/profilePicture.ts, googleAvatarUrl): keep the
-- two in step.
--
-- Same signatures, output columns, volatility, SECURITY DEFINER, search_path
-- and grants as before. member_directory() (the installed apps) is not
-- touched. No data changes. Safe to run again.
--
-- Before (20261009010000_auth_user_summaries.sql; signatures, attributes and
-- grants as below):
--   member_directory_with_avatars():
--     select p.id, p.display_name, p.email, p.voice, p.profile_picture_url,
--            u.raw_user_meta_data ->> 'avatar_url'
--     from public.profiles p
--     left join auth.users u on u.id = p.id
--     where exists (select 1 from public.profiles me where me.id = auth.uid())
--     order by p.display_name asc nulls last;
--   auth_user_summaries():
--     select u.id, u.invited_at, u.confirmed_at, u.email_confirmed_at,
--            u.last_sign_in_at, u.raw_user_meta_data ->> 'avatar_url'
--     from auth.users u;
--
-- Check before applying (read-only): the definitions match "Before"
--   select pg_get_functiondef('public.member_directory_with_avatars()'::regprocedure);
--   select pg_get_functiondef('public.auth_user_summaries()'::regprocedure);
-- and the avatar hosts in use (only lh3.googleusercontent.com is expected;
-- any other host shown here loses its avatar):
--   select split_part(raw_user_meta_data ->> 'avatar_url', '/', 3) as host, count(*)
--   from auth.users where raw_user_meta_data ? 'avatar_url' group by 1 order by 2 desc;
--
-- Check after applying: the number of avatars kept (it equals the count of
-- googleusercontent.com hosts above):
--   select count(avatar_url) from public.auth_user_summaries();
--
-- Rollback: run the two CREATE OR REPLACE FUNCTION statements of
-- 20261009010000_auth_user_summaries.sql again.

begin;

create or replace function public.member_directory_with_avatars()
returns table (
  id uuid,
  display_name text,
  email text,
  voice text,
  profile_picture_url text,
  auth_avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.email, p.voice, p.profile_picture_url,
         case
           when u.raw_user_meta_data ->> 'avatar_url'
                ~* '^https://([a-z0-9-]+[.])+googleusercontent[.]com(/[^[:space:]]*)?$'
           then u.raw_user_meta_data ->> 'avatar_url'
         end
  from public.profiles p
  left join auth.users u on u.id = p.id
  where exists (select 1 from public.profiles me where me.id = auth.uid())
  order by p.display_name asc nulls last;
$$;

revoke all on function public.member_directory_with_avatars() from public, anon, authenticated;
grant execute on function public.member_directory_with_avatars() to authenticated;

create or replace function public.auth_user_summaries()
returns table (
  id uuid,
  invited_at timestamptz,
  confirmed_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.invited_at, u.confirmed_at, u.email_confirmed_at,
         u.last_sign_in_at,
         case
           when u.raw_user_meta_data ->> 'avatar_url'
                ~* '^https://([a-z0-9-]+[.])+googleusercontent[.]com(/[^[:space:]]*)?$'
           then u.raw_user_meta_data ->> 'avatar_url'
         end
  from auth.users u;
$$;

revoke all on function public.auth_user_summaries() from public, anon, authenticated;
grant execute on function public.auth_user_summaries() to service_role;

commit;
