# Sync the Drive index

This Edge Function walks the six Google Drive roots configured in `drive_folders` (racine, adultes, jeunes, enfants, orchestre, cahier-30-ans) with the association's service account and keeps `drive_index_nodes` in step: one row per folder or file (Drive ID, name, type, size, modified time, path), never the files themselves. Every run is logged in `drive_sync_runs`. Refs #433 (F3, part 1).

## Modes

Body: `{ "mode": "dry_run" | "apply" }`. Who triggered the run comes from the caller check (cron secret → `cron`, admin session → `admin` with `triggered_by`), never from the body.

- `dry_run`: walks the roots, compares with the index, stores the diff (added, renamed, moved, removed, unreadable roots) in a `drive_sync_runs` row and returns it. Nothing else is written.
- `apply`: same walk, then `drive_index_apply()` upserts the nodes and soft-deletes (`removed_at`) the ones no longer seen, in one transaction. A node that reappears loses its `removed_at`.

Rules that keep the index safe:

- A root the service account can't read (not shared, wrong ID, not a folder, or a listing that fails midway) is reported in `unreadable_roots` and **its existing rows are left untouched**. Only roots walked completely can produce removals.
- Caps: 8 levels of folders, 5,000 nodes per run. Exceeding one fails the run (`status = 'error'`) instead of recording a partial tree.
- A listing Drive flags as `incompleteSearch` counts as unreadable too: that root is reported and left untouched.
- **A cron apply never mass-removes**: if a root's removals exceed 20 % of its live nodes or 50 nodes, that root is left untouched, the other roots are applied, and the run is recorded as an error (« Trop de retraits pour une synchronisation automatique : vérifiez dans l'admin »). An admin apply, confirmed in the UI, has no such cap.
- Shortcuts are recorded as files with their own mime type and never followed. A folder that is itself a configured root is never entered from another root (`racine` contains the others), so each node belongs to the most specific root.

Callers (`requireInternalSecretOrAdmin` in `_shared/caller-auth.ts`): the nightly `pg_cron` job (03:30 Europe/Paris) sends the internal secret (`x-internal-secret`); the admin's `POST /api/drive-sync` (any admin, from « Espace de travail » → « Synchroniser depuis Drive ») forwards the signed-in admin's access token as `Authorization: Bearer`, which the function verifies through Supabase Auth and whose profile must be `admin` or `superadmin`. The admin app never holds the internal secret. The function keeps the gateway's default `verify_jwt` (no entry in `supabase/config.toml`): both the cron's anon-key bearer and a user's session are valid Supabase JWTs, and the real check happens inside the function.

## Owner setup (in this order)

1. **Google Cloud**: on the project that owns the calendar sync's service account, enable the **Google Drive API** (APIs & Services → Library → Google Drive API → Enable). The function uses the read-only scope `https://www.googleapis.com/auth/drive.readonly`; no new key is needed.
2. **Share the Drive roots**: in Google Drive, share each of the six root folders (the ones listed in the admin's « Dossiers Drive » section) with the service account's `client_email` (the `client_email` field of the JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`) as **Lecteur** (Viewer), without notification. Sharing `racine` alone is enough when the other five are inside it, but sharing all six is harmless.
3. **Function secrets** (Supabase Dashboard → Edge Functions → Secrets): `GOOGLE_SERVICE_ACCOUNT_JSON` and `INTERNAL_FUNCTION_SECRET` already exist for the other functions; nothing to add. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase. The admin's Vercel project needs no new variable.
4. **Apply the migration** `supabase/migrations/20261003120000_drive_index.sql` (`supabase db push`, or the SQL editor). It refuses to apply unless the Vault secrets `project_url`, `anon_key` and `internal_function_secret` exist (the ETA cron and the push trigger already use them): without them the cron job would call the function with empty headers and get 401 every night. It creates the two tables, their RLS policies, `drive_index_apply()` (service_role only) and the cron job.
5. **Regenerate the types**: `npm run db:types` and commit if `packages/domain/src/database.types.ts` differs (the PR ships a hand-written copy of the generated shape).
6. **Deploy the function**: `supabase functions deploy sync-drive-index`.
7. **First run**: in the admin, « Vérifier les changements ». Every root should be readable; a root listed under « Dossiers illisibles » is not shared with the service account yet. Then « Appliquer ces changements ».

## Manual dry run

```bash
curl -X POST "$SUPABASE_URL/functions/v1/sync-drive-index" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "x-internal-secret: $INTERNAL_FUNCTION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode":"dry_run"}'
```

## Tests

The pure parts (walk planner, path builder, diff, run-diff cap) live in `plan.ts` with no Deno globals. Run the tests with:

```bash
npx -y deno test --node-modules-dir=none --allow-env=INTERNAL_FUNCTION_SECRET supabase/functions/_shared/ supabase/functions/sync-drive-index/
npx -y deno check --node-modules-dir=none supabase/functions/sync-drive-index/index.ts
```

## Later parts (not here)

Website and app reading the index, programme/group interpretation of the tree, retiring the admin's Storage explorer.
