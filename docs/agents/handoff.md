# Handoff: state of the work (2026-10-04)

This is for the next session, Claude or human. It picks up where the October 2026 audit and the admin redesign stopped. Read `CLAUDE.md` and `docs/agents/` first, then this page, then the GitHub issues it points to. GitHub is the durable state: issue **#369** is the audit tracker, and issue **#433** holds the redesign mandate, with the owner's decisions in its comments.

## Where things stand

|                       |                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Production (`main`)   | **2.0.123** (`ceb3b62`), verified: e2e on staging, smoke tests, no runtime errors                                             |
| `dev` ahead of `main` | #481 (campaign PATCH whitelist, #471) and this handoff (#482), merged and not yet released                                    |
| Waiting for review    | **Phase 4 wave 3** (#480): **PR #483**, built and up to date with dev; not yet reviewed, e2e-tested on its preview, or merged |

### Released on 2026-10-03 and 2026-10-04

- **2.0.118:** home page JavaScript 435 → 265 KB (#442); Partitions downloads go through the website's proxy (#444); zero lint warnings, with `--max-warnings 0` in CI (#445).
- **2.0.119:** the admin reads the member roster **privately** through a service account (#451, #450); « Synchroniser depuis Drive », a Drive index with a reviewed sync and a nightly run (#449).
- **2.0.120:** admin redesign phases 2–3, direction B « Atelier guidé »: design-system foundation (#456), shell and navigation (#460).
- **2.0.121:** member sync as validate → review → apply (#465, F2 part 1).
- **2.0.122:** Phase 4 wave 1, « Campagne 40 ans » with a deliberate publication step (#470).
- **2.0.123:** Phase 4 wave 2, the Accueil hub (#477).

### Production changes made by the lead, with the owner's go

- `rehearsals_sync_write` was executable by `anon` and `authenticated` (P0, #452). EXECUTE was revoked on 2026-10-03 and the migration merged (#453).
- Drive index migration `20261003120000` applied and `sync-drive-index` v1 deployed on 2026-10-04. The owner's first sync indexed 488 items.

## Owner decisions (details on #433)

- **Admin users:** the communication commission, about 10 occasional volunteers out of more than 120 users.
- **Direction B « Atelier guidé »**, without borrowings for now. The others are still open: C's detail sheet on lists (Phase 4), A's ⌘K (needs the `cmdk` dependency, Phase 5).
- **The « 40 ans » page** launches early 2027 and is the priority.
- **Past concerts, events and rehearsals** are visible in separate « À venir / Passés » tabs.
- **Programmes** live in Google Drive (root → programme → group); files stay private and members open them through the website. The old admin Storage files may be deleted after a read-only count.
- **The Excel roster is the source of truth:**
  - it owns name, postal address, home phone and voice; the member owns mobile phone and photo;
  - a member can have several voice parts;
  - people who leave are **deactivated**, not deleted;
  - every admin can review and apply the sync; hard deletion is superadmin-only;
  - the owner wants an AI check during the sync, but only after choosing a provider with a data-processing agreement, and only on flagged rows, never contact fields.
- **« All functionalities that need changes or improvements are allowed to be modified.** » Security boundaries may only get stricter; production data changes and new dependencies still need the owner.
- **Merging and releasing:** the lead merges approved PRs into `dev` and releases `dev → main` following the checklist below. The owner approved Phases 0–3 and said « you merge whatever you need ».

## Working rules and lessons (2026-10-03/04)

- **Staging has its own database since 2026-10-07** (`website-staging`, fake data, #363): `dev.*`, `admin-dev.*` and PR previews use it. Production keys (old local `.env` files, scripts, the Supabase MCP on `website`) still reach real members. So:
  - no writes to production from tests, scripts or clicks;
  - e2e write specs run in the workflow only, against staging (`E2E_ALLOW_WRITES`); never set it locally against production;
  - **never publish screenshots of logged-in pages**;
  - production writes go through a single-purpose script, after the owner says go.
- **Supabase default privileges** grant EXECUTE on new `public` functions to `anon` and `authenticated`. Always write `REVOKE ALL ON FUNCTION … FROM PUBLIC, anon, authenticated;` and grant only `service_role`. Check with `has_function_privilege` after applying.
- **e2e locators** take `exact: true` and are scoped: `getByRole` matches names by substring, and B often shows a message twice (inline and in the error summary). Two specs failed on staging for this reason.
- **Before merging a wave written without a session,** run the repo's logged-in admin specs against its preview (`scripts/agent/README.md`).
- **The e2e workflow runs daily only.** Before a release, start it by hand on the `dev` head once staging has deployed (`gh workflow run e2e-daily.yml --ref dev -f project=all`).
- **CodeQL runs on release PRs** and has flagged test code and static docs (`docs/redesign/phase-1/*.html`). Read the annotations (`gh api …/check-runs/<id>/annotations`) and fix the code rather than dismissing.
- **Mechanics:**
  - commits use `git -c core.hooksPath=/dev/null commit`;
  - lockfiles come from `npx -y npm@11.19.1`;
  - **never `git stash`** (shared with the owner's checkout);
  - work in worktrees, never in the owner's checkout;
  - admin tests are discovered by `apps/admin/scripts/run-tests.mjs`, so don't edit a test chain in `package.json`.
- **Issues don't auto-close** when their PR merges into `dev`, which isn't the default branch. Reconcile after each release. Probably done but still open: #471 (released with the next release), #346, #345, #319. Check each against merged PRs before closing.

## Release checklist (as practised)

1. Bump PR into `dev`: `node scripts/bump-version.js patch` on a `chore/release-x.y.z` branch; wait for CI; merge.
2. e2e on the **new dev head** must pass (workflow `e2e-daily.yml`, both `test (n)` jobs). A cancelled duplicate run isn't a failure.
3. Staging smoke test: `node scripts/agent/smoke.mjs`, with share links (see the tools).
4. Release PR `dev → main`: required checks **and CodeQL** green; merge.
5. Production: both Vercel deployments succeeded; `node scripts/agent/smoke.mjs https://www.lebontemperament.com https://admin.lebontemperament.com`; runtime errors via the Vercel MCP `get_runtime_errors`. The Android build only runs when app code changed.

## Next steps, in order

1. **Wave 3, PR #483 (#480):** get an independent review, run the logged-in e2e on its preview (`scripts/agent/README.md`), fix the findings, merge, then release 2.0.124 (which also ships #481). In production all 13 concerts and both tours are past, so « Passés » must list them and « À venir » shows its empty state.
2. **Wave 4, « Saison des membres »:** répétitions and événements with « À venir / Passés » tabs; **Partitions et documents** reading the Drive index (F3 part 2):
   - the admin view of programmes → groups → documents;
   - the website and app reading `drive_index_nodes` instead of the live Drive API (app update);
   - then retiring the old Storage explorer (count first; the owner allowed deletion).
3. **Wave 5, « Membres et accès »:** the users list in B; **F2 part 2**:
   - a `profiles.status` migration for deactivation, which **needs the owner's go**;
   - its effects on the website directory, members area and app;
   - an activity type for roster updates.

   Then the AI proof-check, once the owner has chosen a provider.

4. **Wave 6:** Association (CA minutes editable, Signalements), auth and error pages.
5. **Phase 5:**
   - done (P6, 2026-10-08): the dark-mode sweep and the unforced theme with a choice in the account menu; an axe pass on 15 pages in both themes (no violations) and a keyboard check of the skip link, focus order and focus ring;
   - still to do: full regression on the Phase 0 inventory (`docs/redesign/00-inventory.md` a.2–a.4).
6. **Open audit items:** #439, #440 (ready for an agent), #363 (staging database), #364, #355, #354, #352, #350, #348, #344, #329, #328, #321, #400. #397 and #403 wait for the owner or the board.

## Waiting on the owner

- **CNIL decision** on the roster exposure (#450): the 72 h window from 2026-10-03 ends around 2026-10-06 afternoon; the steps and texts are in the session record. Breach register entry.
- **Restrict the Drive folders' sharing (#347):** downloads now go through the website. Then ask the lead to verify Partitions.
- **Member sync, first use:** invite the 13 new people. 29 « modifiés » are only « NOM Prénom » → « Prénom NOM »; tick them only if that format is wanted. 32 people absent from the roster wait for deactivation (F2 part 2).
- `! npx vercel login` on the machine that runs the agent, so the e2e bypass secret can be read again (otherwise use the share-link method).
- Items listed in #368.

## Tools (`scripts/agent/`)

See `scripts/agent/README.md`:

- `smoke.mjs`: the 24 read-only checks;
- `preview-e2e/`: the repo's logged-in admin specs against a protected preview through a Vercel share link;
- `prod-readonly-check.mjs`: calendar and Drive sync runs, the Drive index, definer-function grants, cron jobs, latest migrations. Needs `SUPABASE_ACCESS_TOKEN`; read-only.
