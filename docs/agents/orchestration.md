# Orchestration: running a crew of agents

When an audit yields more independent issues than one agent should work through in sequence, the lead (you) splits them into work packages and runs one implementer agent per package, in parallel, each in its own git worktree. The owner called such a crew "The Swifties" on another project; give this one any name (a choir's voices — sopranos, altos, ténors, basses — suit Le Bon Tempérament). The method is what matters.

## The lead's job

1. **Package the work** so packages touch different files ([below](#packaging)).
2. **Brief** each implementer: the rules file below, its issues, branch, ports, what it may touch, and who else edits nearby files.
3. **Review** every branch: read the diff of the risky parts (RLS and service-role use, auth, payments, API routes the app calls, anything that writes), check the report's claims against the code, rerun gates you doubt.
4. **Open the PRs** yourself, merge in a deliberate order, and send rebase instructions to agents whose branches now conflict.
5. **Keep the owner posted** with short status lines, and route every owner-only step to him.

Implementers never open PRs, merge, push to `main`, write to the database, send notifications, change settings, or print secrets.

## Model routing

Choose the model per subagent when spawning it: one of the user-level agents in `~/.claude/agents/`, or the Agent tool's `model` parameter. Forks always run on the parent's model, whatever is asked.

| Work                                                                                                                                                                      | Model                           | How                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------- |
| Orchestration, architecture, security-sensitive changes (auth, access control, data model and migrations, secrets, production settings), the final review of every branch | the main session's model (Opus) | yourself, or an agent without a model override     |
| Small, fully specified tasks: a one-file fix, a test fix, a rebase with known conflicts, a doc update, a lookup, a mechanical refactor                                    | Sonnet                          | `quick` agent, or `model: "sonnet"`                |
| Read-only work: an audit of one dimension, a codebase search, a second-opinion review of a branch                                                                         | Fable                           | `scout` agent (no edit tools), or `model: "fable"` |
| Medium implementation packages with a clear brief, alongside other implementers                                                                                           | Fable                           | `builder` agent                                    |

- When unsure whether a task is small, it isn't: give it to Fable or keep it on the main model.
- Never route security-sensitive packages to Sonnet.
- Review every report the same way, whatever model wrote it.
- Fable has its own weekly allowance in `/usage`: routing audits, reviews and medium packages to it spares the main allowance for the work that needs it.
- On a machine without the user-level agents, use `general-purpose` with the `model` parameter.

## Before starting a crew: the commit hook

Every commit in a worktree with `node_modules` runs `.husky/pre-commit`, which is `npx lint-staged`: Prettier on the staged files only, no `git add -A`, no build, no version bump. It is fast and safe for a crew, so agents can keep it on. The lead and the agents still run lint, types, tests and builds themselves before each PR (the hook does not), and builds go through the lock below. A crew may skip the hook (`git -c core.hooksPath=/dev/null commit …`) only if the brief says so; then each agent runs `npx prettier --write` on the files it changed.

## Packaging

- One package = one agent = one branch = one PR into `dev`. Group issues by the **files** they touch, and keep apps apart where possible (a website package, an admin package, a mobile package).
- Shared hot spots get a single owner per batch: root `package.json` and `package-lock.json`, `turbo.json`, `packages/domain` (types, consts), each app's `app/globals.css` and `app/layout.tsx`, `apps/website/proxy.ts`, `version.json` and the apps' `package.json` versions, `.github/workflows/*`. Others touch them only minimally and say so in their report.
- **Schema changes go through the owner**: try the migration on `website-staging` first ([supabase/staging](../../supabase/staging/README.md)); production gets it from the owner. One package at most per batch carries a migration, written backward compatible ([release](release.md#supabase)), and nothing that depends on it merges before the owner has applied it.
- **The mobile app** is its own package: Flutter tooling, store releases and backward compatibility with installed versions make it a different rhythm.
- Owner decisions don't block packages: build behind a flag (the `feature_flags` table and the website's `useFeatureFlag` exist; the mobile app doesn't read flags yet) or a placeholder (`TODO(owner)`), filled in when he answers.
- Do last whatever rewrites many files (formatting, renames). Merge it with a merge commit.

## Sharing one machine

- **Worktrees** from `origin/dev`; nobody touches the owner's checkout (it often holds a feature branch in progress).
- **Builds** one at a time: `flock /tmp/lbt-build.lock npx turbo build --filter=<app>`.
- **Ports**: each agent runs dev servers on its own ports (`npm run dev -w website -- -p 32NN`, admin on `33NN`).
- **Database**: there is only production. Agents work read-only against it (local dev pages that only read are fine); anything that would write is mocked, stubbed (`page.route` in Playwright) or deferred to the owner.
- **Dependencies**: `npm ci` per worktree; lockfile changes regenerated with npm, never edited by hand, and owned by one package.

## Merging and rebasing

- Merge first what others depend on (CI and tooling, then `packages/*`, then app features).
- After each merge, test-merge the remaining branches (`git merge-tree --write-tree --name-only origin/dev origin/<branch>`) and send precise rebase instructions: what merged, which files, what to keep from both sides, which checks to rerun. Version files conflict often: keep the higher version and let the release bump settle it.
- Resume agents with a message (they keep their context) rather than restarting them; ask them to commit as they go, since a crash keeps worktrees but loses uncommitted work.

## Implementer rules file (give every implementer this, adapted)

```markdown
# Crew rules

You fix GitHub issues of Le Bon Tempérament. Read CLAUDE.md and the docs/agents pages for your area first,
then your issues with `gh issue view <n>`. If an issue's proposed fix is wrong, do the better one and say why.

## Setup

1. `git fetch -q origin && git switch -c <your-branch> origin/dev` in the worktree you were given.
2. Copy the env files the lead names; `npm ci`. Check which Supabase project the env files point at: production is read-only.

## Hard rules

- Never push to main, never merge, never open a PR: `git push -u origin <your-branch>` when done.
- No database writes, notifications, SMS, emails, payments, settings changes; never print secrets or personal data.
  This repo is public: nothing secret or personal in commits.
- Builds through `flock /tmp/lbt-build.lock`; your dev servers on ports <32NN>/<33NN>.
- No schema change and no new dependency unless your brief allows it. Keep API routes the mobile app calls compatible.
- Stay inside the design guardrails (docs/agents/design-guardrails.md); before/after screenshots for any visible change.
- Commits: <with or without the hook, as the lead says>. `git status` before each commit; English Conventional
  Commits with a scope, `Closes #n` / `Refs #n`, attribution lines at the end.
- Before pushing: lint, check-types, format, the builds of the apps you touched, domain tests or flutter analyze/test
  if relevant. Report exactly what ran.

## Final report (under 400 words)

Branch and commits; per issue: fixed / partly / not done (why); commands run and results; files shared with
other packages; anything risky; owner steps.
```

## Reading reports

Reports are claims. Typical gaps: a "tested" change that never ran the touched path, a fixture copied from real data, a service-role query added without an authorization check, an API change that breaks the installed app, a visual change described without screenshots. Check the diff where it matters, and send it back with precise instructions when it falls short.
