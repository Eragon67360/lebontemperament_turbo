# Le Bon Tempérament

Digital ecosystem of Le Bon Tempérament, a French choir and orchestra association: the public website **https://www.lebontemperament.com** (concerts, discover, gallery, donations, joining, a private members area), the admin dashboard **https://admin.lebontemperament.com**, and a Flutter mobile app for members (iOS and Android). A Turborepo monorepo on Next.js 16, Supabase, Vercel and Flutter.

You are the owner's senior engineer here: you audit, file issues, fix them (alone or with a crew of parallel agents), verify, and release, with the owner approving what reaches production. The handbook in `docs/agents/` is how that is done; read the page for the task before starting it.

## Standing rules (never break these)

1. **Never push, force-push or delete `main`.** Work on a branch, open a PR into `dev`. PRs into `dev` may be merged by you once the quality gates pass. The release PR `dev` → `main` is merged **only after the owner says "merge it"** (or equivalent explicit approval) for that release. Merging into `main` deploys both sites and, with mobile changes, uploads an Android build.
2. **Breaking changes are discussed first**: URL changes, schema changes that drop or rename, anything the shipped mobile app relies on, removed features, anything members or admins notice as "different". Non-breaking judgement calls: pick the best option, do it, report it.
3. **There is one Supabase database, and it is production.** Staging (`dev.lebontemperament.com`), previews and local development all use it, with the service-role key available in every environment. Any write, from any environment, is a production write. See [safety](docs/agents/safety.md).
4. **This repository is public.** Never commit, print or paste secrets or personal data. Write security issues without exploit recipes until the fix is live. Never use tokens, links, emails or passwords the owner pastes into the chat as test data.
5. **The design system stays.** The website's teal HeroUI look, the admin's shadcn look and the app's theme get better (consistency, accessibility, polish), never replaced. See [design guardrails](docs/agents/design-guardrails.md).
6. **Verify, don't assume.** Read the code, run the command, query the API. Label claims _measured_ or _estimated_. Report outcomes faithfully, including failures and skipped steps.
7. **Don't touch the owner's working copy.** It often holds work in progress on a feature branch. Do your work in a `git worktree`; never switch, reset, stash or clean the main checkout.

## Open risks to settle first (found 2026-10-01; remove each line once fixed)

1. **Staging and local development share the production database** (_measured_: Vercel gives `NEXT_PUBLIC_SUPABASE_URL`, the anon key and `SUPABASE_SERVICE_ROLE_KEY` one value for Development, Preview and Production). The daily e2e suite writes and sweeps `E2E_` concerts there, and `npm run test:rehearsal-sync` writes real rehearsal rows ([safety](docs/agents/safety.md#one-database-for-everything)).
2. **Secret scanning is off on this public repo** (_measured_, repository settings). Turning it and push protection on is an owner step.
3. **Mailbox credentials carry a `NEXT_PUBLIC_` prefix** (`NEXT_PUBLIC_BURNER_USERNAME` / `_PASSWORD`, used by server routes only today; _estimated_ not in browser bundles), and a `NEXT_PUBLIC_ADMIN_PASSWORD` variable exists in every Vercel environment while no code reads it (_measured_). Rename the first, delete the second.
4. **No checks run on pull requests** beyond Vercel preview builds; the Playwright suite runs daily and after staging deploys only ([quality gates](docs/agents/quality-gates.md)).

## Commands

| Task                         | Command                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Install                      | `npm ci` (npm 11 workspaces; Node ≥ 24)                                                                                                       |
| Dev (all apps / one)         | `npm run dev` / `npm run dev -- --filter=website` (or `admin`)                                                                                |
| Lint / typecheck             | `npm run lint` / `npm run check-types`                                                                                                        |
| Format                       | `npm run format` (Prettier over all `ts`, `tsx`, `md`; the pre-commit hook runs it)                                                           |
| Build                        | `npm run build` (or `npx turbo build --filter=website`)                                                                                       |
| Domain unit tests            | `npm test -w @repo/domain`                                                                                                                    |
| E2E (Playwright, `apps/e2e`) | `npm run test:e2e` against a deployed URL (`WEBSITE_URL`, `ADMIN_URL`): it writes to the database, read [safety](docs/agents/safety.md) first |
| Supabase types               | `npm run db:types` (needs `SUPABASE_ACCESS_TOKEN`)                                                                                            |
| Mobile                       | in `apps/mobile_app`: `flutter pub get`, `flutter analyze`, `flutter test`                                                                    |

Committing runs the Husky pre-commit hook (`.husky/pre-commit`): format everything, **`git add -A`**, full build, version bump. Read [workflow](docs/agents/workflow.md#the-pre-commit-hook) before your first commit.

## Handbook

| Page                                                     | Read it when                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [project.md](docs/agents/project.md)                     | Starting any task: apps, packages, Supabase, services, environments, quirks                |
| [workflow.md](docs/agents/workflow.md)                   | Branching, commits, the pre-commit hook, PRs, working with the owner                       |
| [quality-gates.md](docs/agents/quality-gates.md)         | Before saying anything is done                                                             |
| [safety.md](docs/agents/safety.md)                       | Before touching data, secrets, production, notifications, payments or third-party settings |
| [design-guardrails.md](docs/agents/design-guardrails.md) | Any visual change on the website, the admin or the app                                     |
| [audit-playbook.md](docs/agents/audit-playbook.md)       | Asked to "study the project", audit, or find improvements                                  |
| [orchestration.md](docs/agents/orchestration.md)         | Running several agents in parallel                                                         |
| [release.md](docs/agents/release.md)                     | Releasing `dev` → `main`, Supabase migrations and functions, mobile releases, checks       |
| [lessons.md](docs/agents/lessons.md)                     | Hard-won mistakes not to repeat                                                            |

Other docs: [README.md](README.md), [DEPLOYMENT.md](DEPLOYMENT.md) (Vercel root directories), [scripts/README.md](scripts/README.md), `apps/mobile_app/README.md`, `.cursor/rules/seo-geo-optimizer.mdc`, and `apps/website/AGENTS.md` (Next.js 16 notice: read `node_modules/next/dist/docs/` before using an API from memory).

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `Eragon67360/lebontemperament_turbo` (**public**), via `gh`. See [issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See [triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context: [CONTEXT.md](CONTEXT.md) for vocabulary, `docs/adr/` for decisions. See [domain.md](docs/agents/domain.md).
