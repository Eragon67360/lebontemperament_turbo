# Quality gates

Nothing is "done" until these pass, and your report says exactly which ran and what they returned. **No CI runs on pull requests** (only Vercel's preview builds), so you run the gates. If you skip one, say which and why.

## Before every PR

| Gate            | Command                                                                                                            | Pass means                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Lint            | `npm run lint` (Turbo, every workspace)                                                                            | no errors, and no new warnings in files you touched                           |
| Types           | `npm run check-types`                                                                                              | no errors in any workspace                                                    |
| Format          | `npm run format` (also run by the pre-commit hook)                                                                 | Prettier defaults + organize-imports + Tailwind class sorting                 |
| Build           | `npx turbo build --filter=<app>` for each app you touched (the hook builds all)                                    | succeeds                                                                      |
| Domain tests    | `npm test -w @repo/domain` when `packages/domain` changed                                                          | all pass                                                                      |
| Supabase types  | `npm run db:types` after any schema change (owner applies the migration first, see [release](release.md#supabase)) | `packages/domain/src/database.types.ts` matches the database and is committed |
| Mobile          | `flutter analyze` and `flutter test` in `apps/mobile_app` when the app changed                                     | no new analyzer issues, tests pass                                            |
| Vercel previews | the PR's preview builds for `lebontemperament` and `lebontemperament-admin`                                        | both ready (they're the only automatic checks)                                |

Add the checks that fit the change:

- **Visible change**: screenshots before and after at **390px** and **1280px**, light and dark theme (website) or the admin shell, plus keyboard and reduced-motion behaviour when interaction or motion changed ([design guardrails](design-guardrails.md#verifying-a-visual-change)). For the app: screenshots on a small and a large phone, light and dark.
- **Access control, auth or RLS change**: prove the forbidden case is forbidden (anonymous, `user`, `admin`, `superadmin`, a member of another group), not only that the allowed case works. For RLS, test with the anon key and a user's session, never with the service-role key (it bypasses RLS).
- **API route change** used by the mobile app (`apps/website/app/api/**`, e.g. `contact/mobile`): the shipped app keeps working (same request and response shape), or the change is versioned.
- **SEO-relevant change** (routes, metadata, JSON-LD, `sitemap.ts`, `robots.ts`, `feed.xml`): check the rendered `<head>` with `curl` on the preview (status codes, canonical, title, description, JSON-LD parses) and `.cursor/rules/seo-geo-optimizer.mdc`.
- **Performance-relevant change**: measure before and after (TTFB with `curl -w '%{time_starttransfer}'`, `x-vercel-cache`, bundle impact in the build output). Numbers, not adjectives.

## The e2e suite

`apps/e2e` runs Playwright against **deployed** sites: `WEBSITE_URL` and `ADMIN_URL` default to staging (`dev.lebontemperament.com`, `admin-dev.lebontemperament.com`), behind Vercel Authentication (`VERCEL_AUTOMATION_BYPASS_SECRET`). It runs daily at ~07:30 Paris time and after each successful staging deployment of `dev` (`.github/workflows/e2e-daily.yml`); a failure opens or updates a GitHub issue, and the next green run closes it.

- Projects: `website` (public pages, API contract, contact-form validation only), `website-members` (members area, logged in), `admin` (auth, dashboard, navigation, and `concerts-write.spec.ts`).
- **`concerts-write.spec.ts` writes to production**: staging shares the production database, so its `E2E_Concert_…` row is briefly visible on the public site; `global-teardown.ts` sweeps `E2E_` rows older than 24 h with the service-role key. Don't add write tests without the owner's agreement, and namespace any that you add the same way.
- **Known noise on every PR** (2026-10-01): the workflow also fires on PR preview deployments, skips them with `process.exit(78)` ("neutral" in GitHub Actions v1, a failure today), and `merge-report` then fails on missing blobs. So `test (1)`, `test (2)` and `merge-report` show red on PRs that changed nothing (e.g. #305, #307). Fixing the skip (`core.notice` and a job-level condition instead of exit 78) is an open improvement.
- To check a change before it reaches `dev`, point `WEBSITE_URL` / `ADMIN_URL` at the PR's preview URLs and run the read-only projects (`npx playwright test --project=website`).

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
