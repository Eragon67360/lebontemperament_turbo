# Production alerts for superadmins

This Edge Function checks production every 15 minutes and pushes what goes wrong to the superadmins' phones through the mobile app (FCM). Refs #364.

## What it checks

| Alert            | Fires when                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rehearsal_sync` | the latest cron run in `rehearsal_sync_logs` failed or was partial, is stuck in `running` for 30 min, or is over 14 h old (it runs at 07:00 and 19:00 Paris) |
| `drive_sync`     | the latest cron run in `drive_sync_runs` failed, is stuck for 30 min, or is over 26 h old (it runs nightly at 03:30 Paris)                                   |
| `cron_jobs`      | a pg_cron job failed in the last 30 min (`cron.job_run_details`)                                                                                             |
| `function_calls` | 2 or more pg_net calls (cron jobs and triggers calling edge functions) answered 4xx/5xx or timed out in the last 30 min                                      |
| `website`        | `https://www.lebontemperament.com/` answers 4xx/5xx or nothing, twice 5 s apart                                                                              |
| `admin`          | `https://admin.lebontemperament.com/auth/login`, same rule                                                                                                   |

Rules and thresholds live in `checks.ts`, covered by `checks_test.ts`. The database side is read in one call to `ops_alert_facts()` (service_role only). The site URLs can be changed with the function secrets `ALERT_WEBSITE_URL` and `ALERT_ADMIN_URL` (for a staging project).

## When it pushes

State lives in `ops_alerts`, one row per alert:

- a new problem is pushed once; while it lasts, again once a day (« Toujours en cours : … »);
- its end is pushed once (« Rétabli : … »), replacing the first notification on the phone (same tag);
- a push that reached no phone is retried at the next check, so a problem raised before any phone was registered arrives once one is. A problem that came and went unpushed stays silent.

## Who receives it

Only phones in `push_devices` whose owner's profile is `superadmin` at send time. The app registers its FCM token after sign-in with `register_push_device(p_token, p_platform)` (`'android'` or `'ios'`) and removes it on sign-out with `unregister_push_device(p_token)`. For any role other than superadmin, `register_push_device` stores nothing and returns `false`. Tokens FCM reports as unregistered are deleted at send time.

The push carries `data: { type: "alert", key, state }` (`state` is `fire`, `remind` or `resolve`). The app's current tap handler ignores unknown types, so a tap simply opens the app.

## Calling it by hand

Callers need the internal secret (`x-internal-secret`), like the other cron functions. From the SQL editor, which reads it from Vault:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/check-ops-alerts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
    'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_function_secret')
  ),
  body := '{"dry_run": true}'::jsonb
);
-- then: select status_code, content from net._http_response where id = <the returned id>;
```

- `{"dry_run": true}`: evaluates every check and returns the findings and what it would push; writes and sends nothing.
- `{"test": true}`: sends one « Test des alertes » push to the registered superadmin phones.

## Setup

Secrets already exist for the other functions: `FIREBASE_SERVICE_ACCOUNT_JSON`, `INTERNAL_FUNCTION_SECRET`. Apply `supabase/migrations/20261007140000_superadmin_ops_alerts.sql` (tables, functions, cron job), then `supabase functions deploy check-ops-alerts`. The function keeps the gateway's default `verify_jwt`: the cron sends the anon key as bearer, and the real check is the internal secret.
