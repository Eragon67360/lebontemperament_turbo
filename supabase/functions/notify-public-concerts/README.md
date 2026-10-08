# Concert pushes for the public app

This Edge Function tells the visitors of the app about our concerts (#593). Once a day (pg_cron job `notify-public-concerts`, 16:00 UTC) it sends to the FCM topic `public_concerts`:

| Push         | When                                                                         | Example                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Announcement | the first run after a concert is created, if it is more than 2 days away     | « Nouveau concert : Stabat Mater » / « Samedi 5 décembre à 20 h, Église, Saverne. Notez la date, on compte sur vous ! » |
| Reminder     | when the concert is 2 days away (1 for a concert created at the last minute) | « Stabat Mater, c’est après-demain ! » / « Samedi 5 décembre à 20 h, Église, Saverne. On vous attend ! »                |

At most 3 pushes a day, soonest concert first; the rest waits for the next day. Dates are counted in Paris. Rules and texts live in `plan.ts`, covered by `plan_test.ts`; `public_concert_pushes` remembers what went out, so each push is sent once and a failed send is retried the next day. The concerts that existed when the migration ran count as announced (their reminders still go out).

## Who receives it

Phones with the app, nobody signed in, and « Prochains concerts » on in « À propos » (on by default). The app subscribes to the topic itself (`SessionNotifications`); nothing about visitors is stored. A member's phone leaves the topic at sign-in: members get every concert through `all_users` (`send-push-notification`). The push carries `data: { type: "concert", id }`, so a tap opens the concert's page.

## Calling it by hand

Callers need the internal secret, like the other cron functions. From the SQL editor:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-public-concerts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
    'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_function_secret')
  ),
  body := '{"dry_run": true}'::jsonb
);
-- then: select status_code, content from net._http_response where id = <the returned id>;
```

`{"dry_run": true}` returns what would be sent today, sending and writing nothing.

## Setup

Secrets already exist for the other functions: `FIREBASE_SERVICE_ACCOUNT_JSON`, `INTERNAL_FUNCTION_SECRET`. Apply `supabase/migrations/20261008120000_public_concert_pushes.sql` (table and cron job; on staging, which has no Vault secrets, the job is not scheduled), then `npx supabase functions deploy notify-public-concerts --project-ref fsklunxplbbtzgurwqmc`. The function keeps the gateway's default `verify_jwt`: the cron sends the anon key as bearer, and the real check is the internal secret.
