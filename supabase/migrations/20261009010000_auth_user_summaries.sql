-- #345: stop paging through every auth user (50 per request, one request per
-- page) on each call of the members directory and the admin's users list.
--
-- 1. member_directory_with_avatars(): member_directory() plus the Google
--    avatar kept in the account's metadata, for signed-in members. Same rows,
--    same order, same access rule; the extra column is what the website used
--    to fetch from the Auth admin API.
-- 2. auth_user_summaries(): the few Auth fields the admin needs (invited /
--    confirmed state, last sign-in, avatar), for every account, in one query.
--    Service role only: the admin's server routes call it, no browser can.
--
-- Additive and backward compatible: member_directory() stays as it is for the
-- installed apps, and the website and admin fall back to the Auth admin API
-- while these two functions do not exist yet.
--
-- Rollback:
--   drop function public.member_directory_with_avatars();
--   drop function public.auth_user_summaries();

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
         u.raw_user_meta_data ->> 'avatar_url'
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
         u.last_sign_in_at, u.raw_user_meta_data ->> 'avatar_url'
  from auth.users u;
$$;

revoke all on function public.auth_user_summaries() from public, anon, authenticated;
grant execute on function public.auth_user_summaries() to service_role;
