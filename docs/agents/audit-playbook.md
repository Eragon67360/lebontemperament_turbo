# Audit playbook

Use this when asked to "study the project", find loopholes or improvements, or audit one area. The output is a set of well-formed GitHub issues and a tracking issue; the fixes follow ([orchestration](orchestration.md)).

## Phases

1. **Audit, in parallel, read-only.** One auditor per dimension below (a subagent each, or one after the other if alone). Auditors read code, run read-only commands, measure the live sites with `curl`, and write findings. They change nothing: no commits, no settings, no database writes, no notifications.
2. **Triage (the lead).** Merge duplicates across auditors, drop what's already fixed, separate what an agent can do from what needs the owner, order by severity.
3. **Ask the owner, once.** One message with numbered questions, each with a recommended answer ([workflow](workflow.md#working-with-the-owner)). Don't block the agent-ready work on it.
4. **File issues** ([format](#issue-format)) plus one tracking issue that groups them into work packages. **The repo is public**: security findings are filed by impact and fix, without exploit steps, until the fix is live.
5. **Fix** in work packages ([orchestration](orchestration.md)), **release** ([release](release.md)), close the loop on the tracking issue.

## Evidence standards

- Every finding cites **where** (`path:line`, URL, setting) and **how you know**: **Measured** (a reproducible command, query or test, shown) or **Estimated** (an inference, with why).
- Severity: **P0** live harm now (security hole, personal data exposed, payments or receipts wrong, data loss, site or app down); **P1** real damage or risk that compounds (members locked out, notifications broken, SEO, performance, accessibility failures, missing safety nets); **P2** quality, consistency, debt.
- One root cause over five symptoms; a fix that removes a class of bug over a patch for one instance.
- Before reporting something as missing, search for it. Read recent merged PRs first: don't re-report what was just fixed, and do verify the fix holds in production.

## Dimensions and starting points

Each list is a starting point, not a boundary. Facts flagged on 2026-10-01 are marked ⚑: verify them first.

### 1. Security, privacy and access

- ⚑ One database for every environment, service-role key everywhere ([safety](safety.md#one-database-for-everything)).
- ⚑ Secret scanning off on a public repo; `NEXT_PUBLIC_` mailbox credentials; an unused `NEXT_PUBLIC_ADMIN_PASSWORD` in Vercel. Scan the git history for committed secrets (`git log -p` searches, or `gitleaks` via `npx`/a container) without printing what you find; report locations only.
- RLS on every table (the core tables' policies live only in the database), service-role usage behind explicit checks, admin role checks (`admin` / `superadmin`), members-area access by group, API routes (auth, validation, reCAPTCHA, enumeration, rate limits), Stripe webhook verification and receipt numbering, delivery tracking tokens and location sharing, uploads, `proxy.ts` guards.
- Mobile: no secrets in the app bundle beyond the anon key; Supabase session storage; push token handling.

### 2. Product, data protection and legal (France / EU)

- Members' and donors' personal data: what is collected (profiles, phone numbers, voices, groups, addresses for deliveries, live locations), who can see it, retention, export and deletion on request (GDPR arts. 15–17).
- `/politique-de-confidentialite` and `/impressum` (an _impressum_ is a German notion; French law asks for _mentions légales_, LCEN art. 6) against GDPR art. 13: controller (the association), purposes, legal bases, processors (Vercel, Supabase, Stripe, Cloudinary, Google, Firebase, Twilio, Mapbox), transfers outside the EU, rights, CNIL.
- Donations: tax receipts (_reçus fiscaux_) correctness and numbering, refunds, Stripe test vs live separation.
- Consent: reCAPTCHA, Google Maps/Mapbox, YouTube embeds, analytics; cookies banner needs.

### 3. SEO and GEO (website)

- `.cursor/rules/seo-geo-optimizer.mdc` is the method. Status codes, canonicals, titles and descriptions, JSON-LD (`components/JsonLd.tsx` and page-level data: Organization, MusicGroup, WebSite, BreadcrumbList, FAQPage, MusicEvent: check that every upcoming concert gets valid MusicEvent data), `sitemap.ts`, `robots.ts`, `feed.xml`, concerts as events in search, internal linking, French content quality, answer-first pages (FAQ).

### 4. Design and accessibility

- Within [design guardrails](design-guardrails.md): WCAG 2.2 AA on the website, members area and admin (keyboard paths, focus, contrast with numbers: the brand teal is 4.29:1 with white, reduced motion, forms), dark mode coverage, 390px layouts, admin pages using `data-state`, mobile accessibility (text scaling, screen readers, touch targets).

### 5. Performance and architecture

- Rendering mode per route, CDN caching (`x-vercel-cache`), TTFB, client component weight (HeroUI, GSAP, motion, FullCalendar, maps, PDF), images via Cloudinary, Supabase query patterns (N+1, `select('*')`, missing indexes), TanStack Query usage in the admin, edge function timeouts and cron health (`rehearsal_sync_logs`), mobile offline cache consistency.
- Monorepo hygiene: duplicate dependencies across workspaces (root `package.json` carries app dependencies), TypeScript 5.9 at the root vs 7 in the apps, `@repo/ui` barely used.

### 6. Engineering and delivery

- No checks on PRs: propose a GitHub Actions workflow (lint, check-types, domain tests, builds, read-only e2e against the preview; `flutter analyze` and `flutter test` for app changes).
- The pre-commit hook (format all, `git add -A`, full build): safe and fast enough? `lint-staged` and a narrower `git add` are candidates, as an owner decision.
- Branch protection: only deletion and force-push are blocked on `main`; a PR requirement plus required checks is possible on this public repo.
- Supabase migrations and functions: no automation and no history for the core tables (a baseline migration from the production schema would fix it).
- Observability: uptime, error tracking, the e2e failure issues, cron and function logs; backups (Supabase plan's PITR window).
- Dependencies: Dependabot security updates are on; version updates aren't configured.
- Tracked artefacts (`desktop.ini`, `portfolio-hover/`, root `migrations/`).

## Issue format

```markdown
## Why

What is wrong or missing, and the impact on members, donors, visitors, admins or the owner.

## Where

`path:line`, URL, setting, and the evidence (Measured: command + output / Estimated: reasoning).

## Proposed fix

What to change, and what not to change (design guardrails, URLs, the shipped app's contracts, data).

## Done when

Observable acceptance criteria, including the test that proves it.
```

Labels: `audit-YYYY-MM` for the batch, an area label (`area:security`, `area:privacy-legal`, `area:seo-geo`, `area:design-a11y`, `area:architecture`, `area:mobile`, `area:ci-devex`), and a triage label: `ready-for-agent`, or `ready-for-human` / `needs-info` when the owner must decide or act. Create missing labels with `gh label create`.

The **tracking issue** lists every issue grouped into work packages (packages touching different files), the owner decisions with recommended answers, and a "later" section. Comment on it as packages merge and releases ship.

## Auditor brief (template)

> You are auditing Le Bon Tempérament for **<dimension>**. Read `CLAUDE.md` and `docs/agents/project.md`, `safety.md` and `audit-playbook.md` first. Strictly read-only: no commits, no database writes (every environment is production), no notifications, SMS or emails, no settings changes, no secrets or personal data printed. Measure the live sites with `curl` where useful. Return at most 15 findings, most severe first, each with: title, severity P0/P1/P2, Measured or Estimated, where, evidence, proposed fix, done-when, and whether it needs an owner decision. Note anything already fixed. Under 1,200 words.
