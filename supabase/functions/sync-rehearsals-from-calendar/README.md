# Sync rehearsals from Google Calendar

This Edge Function syncs future Google Calendar events into `public.rehearsals`.

## Modes

- `?mode=cron`: production sync, `timeMin = now`, no upper bound.
- `?mode=test`: 60-day window, real writes, push notifications silenced.
- `?mode=dry-run`: 60-day window, no rehearsal writes, returns a diff plan.

Every invocation must include `x-sync-secret`.

## Required Edge Function secrets

Set these in Supabase Dashboard > Edge Functions > Secrets:

```text
GOOGLE_SERVICE_ACCOUNT_JSON=<minified service-account JSON>
GOOGLE_CALENDAR_ID=<same value as NEXT_PUBLIC_GOOGLE_CALENDAR_ID>
OPENAI_API_KEY=<OpenAI API key>
SYNC_CRON_SECRET=<openssl rand -hex 32>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase.

## Google service account setup

1. In Google Cloud Console, enable Google Calendar API.
2. Create a service account named `lbt-calendar-sync`.
3. Create and download a JSON key.
4. Open the Google Calendar settings for the calendar referenced by `NEXT_PUBLIC_GOOGLE_CALENDAR_ID`.
5. Share the calendar with the service account email.
6. Grant `See all event details`.

The function uses the readonly scope:

```text
https://www.googleapis.com/auth/calendar.readonly
```

## Vault secrets for pg_cron

Run once in the Supabase SQL editor:

```sql
select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'project_url');
select vault.create_secret('YOUR_ANON_KEY', 'anon_key');
select vault.create_secret('<SAME SYNC_CRON_SECRET>', 'sync_cron_secret');
```

## Manual dry run

```bash
curl -X POST "$SUPABASE_URL/functions/v1/sync-rehearsals-from-calendar?mode=dry-run" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "x-sync-secret: $SYNC_CRON_SECRET"
```

## Deploy

```bash
supabase functions deploy sync-rehearsals-from-calendar
```
