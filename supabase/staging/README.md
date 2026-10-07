# Staging database (`website-staging`)

A second Supabase project, `website-staging` (ref `cevuqyhwtzjujxsocxkb`, same organization and region as production), holds a copy of production's **structure** with **fake data**, so staging (`dev.lebontemperament.com`, `admin-dev.lebontemperament.com`), PR previews and local development stop writing to production (#363).

Production is `website` (ref `fsklunxplbbtzgurwqmc`). Nothing in this folder ever runs there.

## What is in it

| File                       | What it does                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00_prelude.sql`           | Adds `pg_cron` and `pg_net`, and clears the default grants in `public` so the dump's own grants and revokes apply exactly as in production                                             |
| `01_schema.sql`            | Production's `public` schema (tables, functions, triggers, RLS policies, grants), from the owner's `pg_dump --schema-only` of 2026-10-07, taken after migration `20261007140000`       |
| `02_auth_storage.sql`      | The sign-up trigger on `auth.users`, the five storage buckets with their settings, the 19 `storage.objects` policies, and the realtime publication                                     |
| `03_migration_history.sql` | Records the 37 migrations up to `20261007140000` as applied, so new migrations go to staging with the usual tools                                                                      |
| `seed.sql`                 | Fake concerts, tour, events, rehearsals, groups, Drive folders (fake ids), a discover page, a video, a season and the anniversary texts. Every row is tagged `[staging]` or `staging-` |

Loaded on 2026-10-07 and checked against the dump: 38 tables, 25 functions (bodies identical by MD5), 89 policies in `public`, 19 on `storage.objects`, 26 triggers, 111 indexes, 93 constraints, 15 realtime tables, no table without RLS.

## What it does not have

- **No accounts and no member data.** Test accounts are created in the dashboard (below), so no password ever touches git.
- **No cron jobs.** Calendar sync, Drive sync, ops alerts, purges and backups stay production's.
- **No edge functions and no vault secrets.** Features that call a function (AI concert data, Drive sync, push notifications, donation receipts, delivery SMS) fail or do nothing on staging. Push triggers return early without the vault secrets, so staging never pushes to phones. Deploy a function to staging only with test credentials.
- **No storage files.** Buckets exist and are empty.
- Google and Apple sign-in are not configured; staging uses email and password.

## Test accounts

In the Supabase dashboard, project `website-staging` › Authentication › Users › Add user › Create new user (tick "Auto Confirm User"). The sign-up trigger creates the profile with role `user`. To make an account admin, run in `website-staging` › SQL Editor:

```sql
update public.profiles set role = 'admin' where email = '<the account email>';
```

The e2e suite signs in with `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` (GitHub secrets): once staging is wired, those must name an **admin account on staging**.

## Wiring staging into Vercel

In both Vercel projects (`lebontemperament`, `lebontemperament-admin`), Settings › Environment Variables, give `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` a **separate value for Preview and Development** (the staging URL `https://cevuqyhwtzjujxsocxkb.supabase.co` and the keys from `website-staging` › Project Settings › API Keys), keeping Production on the production values. Then redeploy `dev`. In `website-staging` › Authentication › URL Configuration, set the Site URL to `https://dev.lebontemperament.com` and add `https://admin-dev.lebontemperament.com/**`, `https://*-le-bon-temperament.vercel.app/**` and `http://localhost:3000/**` to the redirect URLs.

## Rebuilding from scratch

Only on a new, empty project. Run the files in order in that project's SQL Editor (or with `psql`): `00`, `01`, `02`, `03`, then `seed.sql`. To refresh `01_schema.sql` from production, the owner runs `pg_dump --schema-only --no-owner -n public` against production (Homebrew `libpq` on a Mac), then strip comments, the `\restrict` lines, `CREATE SCHEMA public`, `COMMENT ON SCHEMA public` and every `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin` line. Production's schema is never fetched by an agent.

## Keeping it in step

Every new migration goes to staging first, then to production after release. `seed.sql` can be re-run: it deletes only its own tagged rows before inserting them again.
