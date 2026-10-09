# Sync rehearsals from Google Calendar

This Edge Function syncs future Google Calendar events into `public.rehearsals`.

## Modes

- `?mode=cron`: production sync, `timeMin = now`, no upper bound. The pg_cron job runs it at 07:00 and 19:00 Europe/Paris.
- `&silence=1` (any mode): no push notification for this run, e.g. for a one-off backfill.
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

## All-day rehearsals

Google Calendar all-day events (`start.date`, no `dateTime`) cannot provide hours directly.
After the LLM confirms `is_rehearsal`, known patterns get fixed default times in
`rehearsal-times.ts`:

| Pattern (summary) | Hours (Europe/Paris) |
| ----------------- | -------------------- |
| `Dimanche BT`     | 09:30 – 16:00        |

Add new rules in `ALL_DAY_REHEARSAL_RULES` inside `rehearsal-times.ts`.
All-day events classified as rehearsals but without a matching rule are skipped
with `phase: "times"` in sync logs.

## Address and room

The event's `location` is the source. Each synced rehearsal gets:

- `place`: the short name members read (« Salle des fêtes, Nordheim »);
- `address`: the complete postal address the app's « Itinéraire » opens (null = it searches `place`);
- `room`: the room inside the building (« Salle 12 »), shown with the rehearsal and **never** sent to the maps app.

How they are settled (`place-rules.ts`, after the AI answered):

1. A numbered room (« salle 12 », « Salle n° 104 », « salle B12 ») found in the location, description or summary moves to `room` and is removed from `place` and `address`. A named venue (« Salle des fêtes », « Salle Sainte-Cécile ») is not a room.
2. **Known places** (`KNOWN_PLACES`, also listed in the AI prompt from the same table) override `place` and `address` when the event mentions the village and the AI found the group: Nordheim + Femmes, Wangen + Choeur complet (salle des fêtes), Wangen + Hommes (Freihof), and the Conservatoire de Strasbourg. Add a place by adding a row. A « Dimanche BT » whose `location` is empty is always at the Wangen salle des fêtes (`emptyLocationSummary`); one with another named place or a full address keeps it. An extra rehearsal with no place stays « À confirmer » for the admins to fill in.
3. Groups (`applyGroupRules`): a « Dimanche BT » is always « Choeur complet »; a « Répétition extra » the AI could only call « Tous » becomes « Choeur complet » (a title naming another group keeps the AI's answer).
4. A `location` that already holds a street number is a complete address typed by an admin: it is never overridden.
5. Elsewhere the AI may fill `address` only for a well-known public venue; it must leave it empty rather than invent a number.

What admins should write in Google Agenda: in `location`, the village or, better, the complete address (`1 place Dauphine, 67000 Strasbourg`); the room goes in the same field after it (`Conservatoire de Strasbourg, salle 12`) or in the description.

### Rolling it out

Order: 1) apply the migration `20261009130000_rehearsal_address_room.sql`, 2) deploy the function, 3) run `3-backfill-future-rehearsals.sql`: it sets `google_updated_at = null` on the future synced rehearsals (the sync skips events whose `updated` did not change) and calls the function once with `?mode=cron&silence=1`, so the rows that gain a more precise place (« Nordheim » → « Salle des fêtes, Nordheim ») do not each send « Répétition modifiée ». Without `silence=1` the 07:00 or 19:00 run would notify everyone once per changed rehearsal. The migration alone makes the sync quiet only when name, place, date, hours and group are unchanged (an address or room change).
