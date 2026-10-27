# Scripts

What `scripts/` holds, and the npm script of the root `package.json` that runs each one.

| Script                            | Run with                                                                               | What it does                                                                                                                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bump-version.js`                 | `npm run release:bump` (patch), `npm run bump-version -- <build\|patch\|minor\|major>` | Bumps `version.json`, both apps' `package.json` and `apps/mobile_app/pubspec.yaml` together, on the release PR only ([release](../docs/agents/release.md#preparing-a-release))                                                                 |
| `env/`                            | `npm run env:check`, `npm run env:push`, `npm run env:seed`, `npm run test:env`        | The Proton Pass → Vercel and GitHub sync of environment variables; the templates and the instructions are in [env/README.md](../env/README.md)                                                                                                 |
| `media/media.mjs`                 | `node scripts/media/media.mjs manifest\|upload\|verify\|redirects`                     | Media out of git (#344): rebuilds `apps/website/lib/mediaManifest.json`, uploads to the `site-media` bucket (a dry run unless `--apply`, which writes to production) and checks the result ([project](../docs/agents/project.md#known-quirks)) |
| `test-rehearsal-sync.ts`          | `npm run test:rehearsal-sync`                                                          | Calls the deployed rehearsal sync in test mode (below); it writes real rows                                                                                                                                                                    |
| `agent/`                          | see [agent/README.md](agent/README.md)                                                 | Read-only helpers for releases and checks: `smoke.mjs` (24 checks of the sites), `preview-e2e/` (the admin specs against a protected preview), `prod-readonly-check.mjs` (production state)                                                    |
| `gmail/purge-contact-messages.gs` | pasted into Google Apps Script by the owner (daily trigger)                            | Moves to the bin the contact messages older than the privacy policy allows, in the association's mailbox                                                                                                                                       |

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

The test runner invokes `sync-rehearsals-from-calendar?mode=test`, writes real rehearsal rows, silences push notifications through the sync RPC, and runs all checks before exiting. Given production keys it writes to production: owner approval each time ([safety](../docs/agents/safety.md#what-writes-or-sends-and-where)).
