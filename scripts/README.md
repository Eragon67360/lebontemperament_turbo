# Scripts

## Rehearsal sync test

Run the deployed Google Calendar rehearsal sync in 60-day test mode:

```bash
npm run test:rehearsal-sync
```

The script loads `.env.local` at the repo root when present.

Required environment variables:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ANON_KEY=...
SYNC_CRON_SECRET=...
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are accepted as fallbacks for `SUPABASE_URL` and `ANON_KEY`.

The test runner invokes `sync-rehearsals-from-calendar?mode=test`, writes real rehearsal rows, silences push notifications through the sync RPC, and runs all checks before exiting.
