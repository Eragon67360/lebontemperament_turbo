# Release and production

`main` is production. A release is one PR `dev` → `main`, merged only with the owner's explicit go. What a merge does:

- **Website and admin**: Vercel deploys `www.lebontemperament.com` and `admin.lebontemperament.com` (projects `lebontemperament`, `lebontemperament-admin`, built from the repository root with `turbo build --filter=website` / `--filter=admin`, see [DEPLOYMENT.md](../../DEPLOYMENT.md)).
- **Android**: `.github/workflows/android-build-release.yml` runs on pushes to `main` that touch `apps/mobile_app/**` (a `pubspec.yaml`-only change doesn't trigger it): builds a signed app bundle with production secrets and uploads it to Google Play's **internal** track as a **draft**. Promoting it to testers or production is a manual step in the Play Console (owner).
- **iOS**: manual (Xcode / App Store Connect), owner.
- **Supabase**: nothing. Migrations and edge functions are deployed separately ([below](#supabase)).

## Supabase

There is one database, used by production, staging, previews and local development. A migration applied anywhere is applied everywhere, immediately, and installed mobile apps keep running old code against it for weeks. So:

- **Every migration is backward compatible** with the code currently on `main`, on staging, and in every app version still installed: add tables and nullable columns first; ship code that uses them; backfill; only in a later release make columns required, rename or drop, and only once no supported app version uses them.
- **The owner applies migrations** (Supabase CLI `supabase db push` linked to the project, or the SQL editor), unless he explicitly delegates one. Your PR contains the migration file in `supabase/migrations/` with a timestamped name, the exact SQL reviewed line by line, RLS enabled with policies for any new table, and a rollback note (Supabase migrations have no automatic `down`).
- **Order**: migration applied → `npm run db:types` → code using it merged into `dev`. Code merged before its migration breaks staging (and production on release).
- **Edge functions** are deployed with `supabase functions deploy <name>` by the owner (or with his approval). Scheduled jobs (`pg_cron`) live in migrations (e.g. `20260626091000_cron_sync_rehearsals.sql`); check `rehearsal_sync_logs` (or `drive_sync_runs` for the Drive index) after a change to a sync.
- The core tables have no migration history; before changing one, read its current definition and policies from the database (read-only) and capture them in the migration's comments.

## Preparing a release

1. Make sure `dev` contains exactly what should ship: `git log --oneline origin/main..origin/dev`.
2. Confirm the gates on the `dev` head: lint, check-types, builds, domain tests, `flutter analyze` / `flutter test` if the app changed, the latest e2e run on staging green (Actions → "E2E Daily (staging)").
3. Bump versions in a small PR into `dev` (`dev` requires pull requests): on a `chore/release-<version>` branch run `npm run release:bump` (patch; `npm run bump-version -- minor` or `major` for bigger ones), commit `version.json`, both apps' `package.json` and `apps/mobile_app/pubspec.yaml`, open the PR and merge it once CI is green. If the app version changed and Flutter is installed, run `flutter pub get --no-example` in `apps/mobile_app` and commit `pubspec.lock` if it changed (the old hook did it). The script does not touch `package-lock.json`.
4. Open the release PR with a body the owner can approve from his phone:
   - a table of what ships (PR, one line, issue numbers);
   - what visitors, members, admins and app users will notice;
   - Supabase migrations and function deploys involved, confirmed applied (or the order to apply them);
   - whether an Android build will be uploaded, and what to do with it in the Play Console; iOS steps if any;
   - owner steps in order (settings that depend on the new code come **after** the deploy); risks and rollback.
5. Wait for "merge it". Then `gh pr merge <n> --merge` (no `--delete-branch`: the head is `dev`).

## After merging

1. **Watch both deployments** until ready (`vercel ls lebontemperament --prod --scope le-bon-temperament`, same for `lebontemperament-admin`; `vercel inspect <url> --logs` on failure).
2. **Smoke-test production** with `curl` (status codes and a content check):
   - website: `/`, `/concerts`, `/decouvrir`, `/galerie`, `/don`, `/rejoindre`, `/faq`, `/contact`, `/40-ans`, `/sitemap.xml`, `/robots.txt`, `/feed.xml`, a known-bad URL (real 404);
   - members area and admin: the login pages answer; protected pages redirect when signed out;
   - API routes the app calls answer with the expected shape (no writes).
3. **Check runtime errors** for the new deployments in the first minutes (Vercel logs).
4. If the Android workflow ran, confirm it succeeded and tell the owner the draft is waiting in the Play Console.
5. Walk the owner through his post-release steps, verifying each (API read, `curl`) as he completes it.
6. Comment on the tracking issue: what shipped, what was verified, what's left. Close issues whose `Closes #n` didn't fire.

## Rolling back

- **Web**: Vercel can promote the previous production deployment (owner's approval). Code rolls back; the database doesn't.
- **Database**: write a forward fix; don't revert a migration on production without the owner.
- **Mobile**: an installed app can't be rolled back; ship a fixed build. The `feature_flags` table is read by the website and admin (`/api/feature-flags`, `useFeatureFlag`) but not by the app today; having the app read it is worth doing before risky app-facing changes, so they can be switched off remotely.
