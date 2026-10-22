# Purge of order forms

An order can carry the order form its buyer handed in (« bon de commande », a scan, photo, PDF, Word or Excel file), stored in the private bucket `order-documents` under `<order id>/…` (migration `20261022142528_member_orders.sql`). The privacy policy erases a buyer's data 30 days after the sale's delivery day: the nightly `purge_expired_order_personal_data()` (pg_cron, 03:35 UTC) clears the order's name, contact, member link and document reference, but Supabase refuses direct deletes from `storage.objects`, so the file itself waits for this function.

Every day at 03:50 UTC the pg_cron job `purge-order-documents` calls it. It asks `order_documents_to_purge()` (service role only) for up to 1,000 files older than a day that no live order points at, and removes them through the Storage API. That covers purged orders, orders and sales deleted from the admin or the app, replaced documents and uploads that were never attached.

## Caller

The cron job, with the internal secret (`x-internal-secret`) read from Vault, like the other cron functions. Without the Vault secrets (`project_url`, `anon_key`, `internal_function_secret`), as on staging, the job calls nothing.

`{ "dry_run": true }` returns how many files it would remove and changes nothing:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-order-documents',
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

Uses the existing secret `INTERNAL_FUNCTION_SECRET`. Apply the migration, then `npx supabase functions deploy purge-order-documents --project-ref fsklunxplbbtzgurwqmc`. Until it is deployed, pg_net records one 404 a day and unreferenced files simply wait in the private bucket, where nobody but superadmins can read them; the first files can't be due before late December 2026 (the November sale delivers on 27 November).
