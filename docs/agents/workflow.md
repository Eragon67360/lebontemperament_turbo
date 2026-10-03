# Workflow

How work moves from an idea to production, and how to work with the owner.

## The flow

```
issue (GitHub) ──► branch from origin/dev ──► PR into dev ──► gates pass ──► merge into dev ──► staging (dev.*)
                                                                                                    │
                 owner says "merge it" ◄── release PR dev → main (summary of what ships) ◄──────────┘
                          │
                          └──► merge ──► Vercel deploys www + admin ──► Android build to Play (internal, draft) if the app changed ──► checks
```

1. **Issue first** for anything bigger than a typo: why, where, what "done" means ([issue format](audit-playbook.md#issue-format)). The repo is public: keep personal data and exploit details out of issues.
2. **Branch** from a fresh `origin/dev` in a worktree: `git fetch origin && git worktree add ../lbt-<topic> -b <type>/<topic> origin/dev`. Branch names in history: `feat/…`, `fix/…`, `bugfix/…`, `refactor/…`, `chore/…`, `ci/…`, `test/…`, `docs/…`.
3. **Commits**: English Conventional Commits with a scope when one app is concerned (`feat(admin): …`, `fix(website): …`, `fix(domain): …`, `test(e2e): …`), one logical change each, body says why and links the issue (`Closes #12` / `Refs #12`). End each message with the attribution lines your harness provides.
4. **PR into `dev`**: what changed, why, how it was verified (exact commands and results), owner steps if any. Vercel builds previews of both sites for the PR; those are the only automatic checks.
5. **Merge into `dev`** yourself once the gates pass and the diff has been reviewed: `gh pr merge <n> --merge` (this repo uses **merge commits**). `dev` then deploys to staging, and the e2e suite runs against it.
6. **Release** `dev` → `main` when a coherent batch is ready: see [release.md](release.md). Merge it only after the owner's explicit go for that PR.

Never use `--delete-branch` on a release PR (its head is `dev`).

## The pre-commit hook

`.husky/pre-commit` runs on every commit made in a checkout where `npm ci`/`npm install` has installed Husky (the `prepare` script; skipped on CI and Vercel):

1. `npm run format` — Prettier over **every** `ts`, `tsx` and `md` file in the repo;
2. `git add -A` — stages **everything** in the working tree, untracked files included;
3. `npm run build` — builds all apps (slow, and the website build may need its env variables);
4. `node scripts/bump-version.js patch --if-changed` — bumps `version.json` and the changed apps' versions, and syncs the Flutter version when `pubspec.yaml` changed.

Consequences for you:

- **Keep the working tree clean** before committing: anything lying around (screenshots, logs, scratch scripts, `.env` copies not covered by `.gitignore`) gets committed. Keep scratch files outside the repository, run `git status` before committing, and check `git show --stat HEAD` after.
- **Expect version bumps** in commits that touch an app. That is the owner's convention; keep them.
- **Commits take minutes** (full build). Batch related changes into one commit rather than many tiny ones.
- If the hook fails, fix the cause. Don't bypass it with `--no-verify` unless the owner agrees for that case.
- A worktree without `node_modules` has no `.husky/_` directory, so the hook does not run there (docs-only commits); after `npm ci` in a worktree it does.

## Working with the owner

The owner is the product owner and decides; you are trusted to run everything else.

- **Recommend, don't survey.** When a decision is needed, give numbered questions, each with your recommended answer, batched in one message. He often answers "go with your recommendations". If an answer is ambiguous, state your interpretation and proceed.
- **Facts are your job.** Don't ask what you can find out: read the code, query an API read-only, search the docs, measure the site. Ask only for real decisions: breaking changes, taste, scope, money, anything that touches members, donors or the association's identity, and anything only he can do in a dashboard.
- **Don't block on non-breaking calls.** Pick, proceed, report. Discuss breaking changes before doing them.
- **Things only he can do** (Supabase dashboard and SQL on production, secrets, Vercel and GitHub settings, Stripe, Google, Firebase, store consoles): give exact click-paths or commands, the order, and why. Then verify the result yourself (API read, `curl`) when you can.
- **Keep him posted** with short status lines while long work runs (he sometimes follows from his phone): what finished, what's running, what's waiting on him. Lead with what needs him.
- **Report faithfully**: failures with evidence, skipped steps named, estimates labelled. When you made a mistake, say what it was, the impact, and what you did about it.
- **Ask before outward or hard-to-reverse actions** not already authorised here: anything writing to the database, sending notifications, SMS or emails, payments, publishing, deleting, spending money, third-party configuration. A permission prompt or classifier refusal is a "no": hand the step to the owner with instructions instead of working around it.

## Definition of a good PR

- Does one thing, or one coherent package of things, and says so in its title.
- Has tests that would have failed before the change (or says why that's impossible).
- Stays within the [design guardrails](design-guardrails.md), with screenshots for visible changes.
- Keeps the shipped mobile app working: no API or schema change that an installed app version still relies on, unless the owner decided otherwise.
- Leaves docs true (README, this handbook, `CONTEXT.md`, ADRs).
- Lists owner steps explicitly, in order, at the end of the description.
