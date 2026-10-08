# Purge of old signalement screenshots

The privacy policy keeps signalements 1 year at most after they are resolved (#355). The database purge `purge_expired_records()` (migration `20261008110000_privacy_retention_purges.sql`, pg_cron job `purge-expired-records`, daily at 03:45 UTC) deletes those reports with their messages and notifications, but it can't delete files: Supabase refuses direct deletes from `storage.objects`. So a report that still lists screenshots waits for this function.

Every day at 03:40 UTC the pg_cron job `purge-bug-screenshots` calls it. It reads up to 200 reports resolved more than 365 days ago that still list screenshots, removes their files from the private bucket `bug-screenshots` through the Storage API (only paths inside the author's folder, `<user id>/…`), then empties `screenshot_paths`. The database purge deletes the reports five minutes later.

## Caller

The cron job, with the internal secret (`x-internal-secret`) read from Vault, like the other cron functions. Without the Vault secrets (`project_url`, `anon_key`, `internal_function_secret`), as on staging, the job calls nothing.

`{ "dry_run": true }` returns how many reports and files it would remove and changes nothing:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-bug-screenshots',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
    'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_function_secret')
  ),
  body := '{"dry_run": true}'::jsonb
);
-- then: select status_code, content from net._http_response order by id desc limit 1;
```

## Setup

Uses the existing secret `INTERNAL_FUNCTION_SECRET`. Apply the migration, then `npx supabase functions deploy purge-bug-screenshots --project-ref fsklunxplbbtzgurwqmc`. Until it is deployed, pg_net records one 404 a day and reports with screenshots simply wait; the first app signalements (2.0.138) can't be due before October 2027.
