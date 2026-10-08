# Moving production to the new Supabase API keys (#570)

Production (`website`, ref `fsklunxplbbtzgurwqmc`) still runs on the legacy JWT keys (`anon`, `service_role`). Staging already runs on the new keys only ([staging](staging/README.md)). This page is the owner's checklist to switch production, step by step, without breaking anything. Each step can wait as long as needed; the legacy keys keep working alongside the new ones until step 7, and Supabase keeps them working until the end of 2026.

**Never disable the legacy keys before step 7's conditions are all true.** Installed apps carry the legacy anon key until a release ships the publishable key (step 6) and members install it.

## What the repository already does (PR for #570)

- **Edge functions** read their admin key from `SUPABASE_SECRET_KEYS` (the `default` secret key) when the project has one, else from the legacy `SUPABASE_SERVICE_ROLE_KEY` ([`_shared/supabase-keys.ts`](functions/_shared/supabase-keys.ts)). Both are provided by Supabase; nothing to set.
- **The 8 functions the database calls** (`send-push-notification`, `notify-bug-report`, `check-eta-and-send-arrival-sms`, `check-ops-alerts`, `notify-public-concerts`, `purge-bug-screenshots`, `generate-concert-event-data`, `sync-drive-index`) are deployed with `verify_jwt = false` ([config.toml](config.toml), owner's go 2026-10-08): the gateway's check only understands JWT keys. Each refuses any caller without the internal secret (or, for the last two, an admin session) before doing anything. `sync-rehearsals-from-calendar` (sync secret) and `redeem-delivery-code` (public, rate-limited) already were. The driver's functions keep the gateway check: the app always calls them with the member's session.
- **Migration `20261008223000_edge_function_key_headers.sql`**: the push triggers and the six cron jobs that call functions take their key headers from `edge_function_auth_headers()`. While the Vault secret `anon_key` holds the legacy key, they send exactly what they send today (plus an `apikey` header). Once it holds the publishable key, they send it on `apikey` only. Applying it changes nothing by itself.
- **Website and admin** already accept the new keys (`@supabase/supabase-js` 2.117, `@supabase/ssr` 0.12); staging proves it.
- `scripts/test-rehearsal-sync.ts` sends a publishable key on `apikey` only.

## The owner's steps

Keys are copied from Supabase › `website` › Project Settings › **API Keys**. Never paste a key into a chat, an issue or a file in the repository.

### 1. Create the new keys (once, safe)

API Keys › tab « Publishable and secret API keys ». If you see « Create new API keys », click it: it adds a `default` publishable key and a `default` secret key next to the legacy ones, which keep working. Use these `default` keys everywhere below (the website and `redeem-delivery-code` share a rate-limit counter keyed with the secret key, so they must hold the same one).

### 2. Apply the migration (no visible effect)

Supabase › `website-staging` › SQL Editor: paste `supabase/migrations/20261008223000_edge_function_key_headers.sql`, Run (staging has no cron jobs or Vault secrets, so it only adds the function). Then the same in `website` (production). The output lists a notice per cron job rewritten (six). If it stops with « A cron job still sends the Vault anon_key as a Bearer token », nothing was changed (the whole file is one transaction): send the error to Claude.

Check, in production:

```sql
select jobname, command like '%edge_function_auth_headers()%' as uses_helper
from cron.job order by jobname;
select public.edge_function_auth_headers() ? 'Authorization' as still_sends_bearer; -- true until step 5
```

### 3. Redeploy the edge functions (from `main`, once the release carrying this PR is merged)

From the repository root, on an up-to-date `main`:

```bash
for f in check-eta-and-send-arrival-sms check-ops-alerts generate-concert-event-data notify-bug-report notify-public-concerts optimize-recipients-route purge-bug-screenshots redeem-delivery-code send-delivery-complete-sms send-delivery-invitations send-delivery-sms send-push-notification start-delivery-round sync-drive-index sync-rehearsals-from-calendar; do npx supabase functions deploy "$f" --project-ref fsklunxplbbtzgurwqmc || break; done
```

Check: Supabase › Edge Functions › each of the 8 functions above › Details shows « Enforce JWT verification » **off**; the five driver functions (`optimize-recipients-route`, `send-delivery-*`, `start-delivery-round`) show it **on**. Within 15 minutes the ops-alerts cron runs; step 5's check query shows a 200.

Rollback: redeploy the previous version of a function from the dashboard (Edge Functions › function › Deployments), or `git checkout <previous main sha>` in a worktree and deploy from there.

### 4. Website and admin (Vercel, Production only)

In both Vercel projects (`lebontemperament`, `lebontemperament-admin`) › Settings › Environment Variables, **Production** values only (Preview and Development already hold staging's keys):

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the `default` **publishable** key (`sb_publishable_…`);
- `SUPABASE_SERVICE_ROLE_KEY` = the `default` **secret** key (`sb_secret_…`).

The names stay, only the values change. They apply to the next production build: do this **before** saying « merge it » for a release, so the release builds with them (a dashboard Redeploy is cancelled by `turbo-ignore` when no app code changed, see [DEPLOYMENT.md](../DEPLOYMENT.md)). Then:

- in Proton Pass › `LBT Production` › `Supabase`, store the same two values in `anon_key` and `service_role_key`, or the next `npm run env:push -- production` would put the legacy keys back;
- check after the deploy: the home page, `/concerts`, signing in to the members area and to the admin, the members list, a concert opened in the admin, and « Synchroniser depuis Drive » in dry run.

Rollback: Vercel › Deployments › the previous production deployment › « Instant Rollback » (it carries the old values), then put the legacy values back in the variables.

### 5. Vault: the database sends the publishable key

After step 2 and step 3. Supabase › `website` › SQL Editor (paste the key where shown, in the editor only):

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'anon_key'),
  'sb_publishable_PASTE_THE_DEFAULT_PUBLISHABLE_KEY_HERE'
);
select public.edge_function_auth_headers() ? 'Authorization' as still_sends_bearer; -- false
```

Check, 20 minutes later (the ops-alerts cron runs every 15 minutes; the ETA cron only during a delivery round):

```sql
select r.id, r.status_code, r.created
from net._http_response r
where r.created > now() - interval '30 minutes'
order by r.id desc limit 20;
```

Every row should be `200`. A `401` with `Invalid JWT` means a function still has the gateway check (step 3 not done for it); a `401` `Unauthorized` means the internal secret doesn't match (unrelated to this change). Then trigger a push, for example a reply to a signalement in the admin, and check that the phone receives it.

Rollback (immediate): the same `vault.update_secret` with the **legacy anon key** (API Keys › tab « Legacy API keys »).

### 6. Mobile apps (a later release, tested first)

The app reads `SUPABASE_ANON_KEY` from the GitHub repository secret at build time. After steps 3 and 5 are verified:

```bash
gh secret set SUPABASE_ANON_KEY -R Eragon67360/lebontemperament_turbo   # paste the default publishable key at the prompt
```

The next Android and iOS builds then carry the publishable key. Test that build before it reaches members (internal testing / your own phone): signed out, the public home, concerts and « Nous rejoindre »; a delivery code (« J'ai un code »); signing in with e-mail, Google and Apple; the members list; a signalement and its reply push; as superadmin, starting a delivery round. Rollback: set the secret back to the legacy anon key and rebuild.

### 7. Disable the legacy keys (much later)

Only when **all** of these are true:

- the app versions that carry the legacy key are gone: `mobile_min_version` raised to the version from step 6, and members updated (the banner only advises, so give it weeks);
- steps 2 to 5 done and verified (the database and every function use the new keys);
- nothing else holds a legacy key: Vercel Production (step 4), GitHub secrets, local `.env` files, `scripts/agent` checks run with the new keys.

Then API Keys › « Legacy API keys » › Disable. It can be re-enabled from the same page if something was missed. Close #570.

Not part of this: moving Auth to JWT signing keys (a separate migration, see Supabase's « JWT signing keys »).
