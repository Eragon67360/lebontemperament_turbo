# Quality gates

Nothing is "done" until these pass, and your report says exactly which ran and what they returned. `.github/workflows/ci.yml` runs lint, types, domain tests, the builds of the changed apps and the Flutter checks on every PR into `dev` or `main` (check names: `Lint`, `Types`, `Domain tests`, `Build website`, `Build admin`, `Flutter`). A job that already passed on identical code (the same tree; for the app jobs, the same `apps/mobile_app` and `ci.yml`) is skipped, with a notice on the run linking the run that passed: the release PR `dev` → `main` usually reuses the version-bump PR's run. Run them locally anyway before opening the PR, since the hook and CI take minutes. If you skip one, say which and why.

## Before every PR

| Gate            | Command                                                                                                            | Pass means                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Lint            | `npm run lint` (Turbo, every workspace)                                                                            | no errors, and no new warnings in files you touched                           |
| Types           | `npm run check-types`                                                                                              | no errors in any workspace                                                    |
| Format          | `npm run format` (the pre-commit hook formats staged files only)                                                   | Prettier defaults + organize-imports + Tailwind class sorting                 |
| Build           | `npx turbo build --filter=<app>` for each app you touched                                                          | succeeds                                                                      |
| Domain tests    | `npm test -w @repo/domain` when `packages/domain` changed                                                          | all pass                                                                      |
| Supabase types  | `npm run db:types` after any schema change (owner applies the migration first, see [release](release.md#supabase)) | `packages/domain/src/database.types.ts` matches the database and is committed |
| Mobile          | `flutter analyze` and `flutter test` in `apps/mobile_app` when the app changed                                     | no new analyzer issues, tests pass                                            |
| Vercel previews | the PR's preview builds for `lebontemperament` and `lebontemperament-admin`                                        | both ready (CI builds with placeholder env; previews prove the real config)   |

Add the checks that fit the change:

- **Visible change**: screenshots before and after at **390px** and **1280px**, light and dark theme (website) or the admin shell, plus keyboard and reduced-motion behaviour when interaction or motion changed ([design guardrails](design-guardrails.md#verifying-a-visual-change)). For the app: screenshots on a small and a large phone, light and dark.
- **Access control, auth or RLS change**: prove the forbidden case is forbidden (anonymous, `user`, `admin`, `superadmin`, a member of another group), not only that the allowed case works. For RLS, test with the anon key and a user's session, never with the service-role key (it bypasses RLS).
- **API route change** used by the mobile app (`apps/website/app/api/**`, e.g. `contact/mobile`): the shipped app keeps working (same request and response shape), or the change is versioned.
- **SEO-relevant change** (routes, metadata, JSON-LD, `sitemap.ts`, `robots.ts`, `feed.xml`): check the rendered `<head>` with `curl` on the preview (status codes, canonical, title, description, JSON-LD parses) and `.cursor/rules/seo-geo-optimizer.mdc`.
- **Performance-relevant change**: measure before and after (TTFB with `curl -w '%{time_starttransfer}'`, `x-vercel-cache`, bundle impact in the build output). Numbers, not adjectives.

## The e2e suite

`apps/e2e` runs Playwright against **deployed** sites: `WEBSITE_URL` and `ADMIN_URL` default to staging (`dev.lebontemperament.com`, `admin-dev.lebontemperament.com`), behind Vercel Authentication (`VERCEL_AUTOMATION_BYPASS_SECRET`). `.github/workflows/e2e-daily.yml` runs it daily at ~07:30 Paris time and after each successful staging deployment of `dev`, always against the `dev` branch (scheduled and manual runs check out `dev`; deployment runs check out the deployed commit).

- Projects: `website` (public pages, API contract, contact-form validation only), `website-members` (members area, logged in), `admin` (auth, dashboard pages from `apps/admin/utils/routes.ts`, navigation, and `concerts-write.spec.ts`).
- **The suite is read-only by default.** `concerts-write.spec.ts` creates and deletes an `E2E_Concert_…` row through the admin UI, and `global-teardown.ts` sweeps `E2E_` rows older than 24 h with the service-role key: both only run with `E2E_ALLOW_WRITES=1`, which nothing sets yet. Staging has its own database since 2026-10-07 (#363), so the workflow can set it, with `website-staging`'s `NEXT_PUBLIC_SUPABASE_URL` and secret key for the sweep; never run it with production keys. Don't add write tests without the owner's agreement, and namespace any that you add the same way.
- **Workflow shape**: a `gate` job decides whether the event is worth a run (not a `deployment_status`, or a successful Vercel Preview deployment whose commit is the `dev` head) and waits for both Vercel projects; `test` (two shards) and `merge-report` are skipped at job level otherwise, so PR previews show no red e2e checks. `merge-report` opens or updates the `e2e-failure` issue when `needs.test.result` is `failure` and closes it when it is `success` (never on manual runs). Since `.github/workflows/ci.yml`, every PR into `dev` or `main` also runs lint, types, domain tests, builds and Flutter checks.
- To check a change before it reaches `dev`, point `WEBSITE_URL` / `ADMIN_URL` at the PR's preview URLs and run the read-only projects (`npx playwright test --project=website`, `--project=website-members`, `--project=admin` with `E2E_ALLOW_WRITES` unset).

## Tests worth writing

- A test that **would have failed before** the change. If you can't write one, say why.
- Test refusals and edges: wrong role, other group's data, missing field, expired token, unknown slug (404), oversized upload.
- **Never real data in fixtures**: no real names, emails, phone numbers, tokens, reset links or passwords, even from the owner's own messages. Use obviously fake values (`member@example.com`, `"test".repeat(6)`).
- Assert what users or crawlers see (role, name, text, status, header), not class names or internal state.
- Flaky test? Find the race (await the response; let animations settle before an accessibility scan) instead of adding retries.

## Accessibility bar

WCAG 2.2 AA on the website, the members area and the admin: keyboard reachable, visible focus, contrast ≥ 4.5:1 for text and 3:1 for UI states, `prefers-reduced-motion` honoured (`apps/website/hooks/useReducedMotion.ts`), the high-contrast override in `globals.css` kept working, no information by color alone, a usable layout at 390px. There is no automated axe scan yet; adding `@axe-core/playwright` checks to `apps/e2e` is a recommended improvement.

## The report

End every piece of work with: what changed, the exact commands run and their results, what failed or was skipped, anything risky for the reviewer, and owner steps in order.
