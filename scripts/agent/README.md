# Agent tools

Read-only helpers the lead agent used for releases and checks. None of them write anything, and none contain secrets: they read secrets from the environment. Given production keys they read the **production** database, so keep them read-only. A production write is a single-purpose script, run after the owner's go.

## `smoke.mjs`: 24 read-only checks

```sh
# staging is behind Vercel deployment protection: pass share links
SHARE_WEBSITE='https://dev.lebontemperament.com/?_vercel_share=…' \
SHARE_ADMIN='https://admin-dev.lebontemperament.com/?_vercel_share=…' \
node scripts/agent/smoke.mjs

# production (custom domains are public)
node scripts/agent/smoke.mjs https://www.lebontemperament.com https://admin.lebontemperament.com
```

Share links come from the Vercel MCP tool `get_access_to_vercel_url` (team `le-bon-temperament`) and last about 23 hours. The tracking-RPC check reads the public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the environment or `apps/website/.env.local`, and is skipped when they're absent.

## `preview-e2e/`: the repo's logged-in admin specs against a protected preview

Useful before merging a PR when the bypass secret isn't available (the Vercel CLI token has expired, or you're in a cloud session):

```sh
cd apps/e2e
ADMIN_URL='https://lebontemperament-admin-<hash>-le-bon-temperament.vercel.app' \
SHARE_ADMIN='<share link for that URL>' \
PW_STATE=/tmp/admin-state.json \
E2E_USER_EMAIL=… E2E_USER_PASSWORD=… \
npx playwright test --config ../../scripts/agent/preview-e2e/playwright.config.mjs --grep-invert "anonymous|unauthenticated"
rm -f /tmp/admin-state.json
```

- The anonymous specs can't pass the protection cookie and run on staging as usual.
- Write specs stay skipped, as on staging.
- The preview URL comes from the PR's deployments (`gh api repos/<owner>/<repo>/deployments?sha=<head>`, environment containing `admin`, then `statuses[0].environment_url`).
- The e2e account belongs to the owner: never commit or print its credentials.
- Screenshots of logged-in pages show real members: don't publish them.

## `prod-readonly-check.mjs`: production state, read-only

```sh
SUPABASE_ACCESS_TOKEN=… node scripts/agent/prod-readonly-check.mjs
```

It prints names, statuses and counts only:

- calendar and Drive sync runs;
- Drive index per root;
- `SECURITY DEFINER` functions executable by `anon`/`authenticated`;
- cron jobs;
- latest applied migrations.
