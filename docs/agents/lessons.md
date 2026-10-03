# Lessons

Mistakes and near-misses from running this way of working on the owner's projects (most from Taylor's Secret Garden, a sister project with the same owner, workflow and hosting). Each is a rule because it cost something once.

## Production and settings

- **Code first, settings after.** An auth setting and an email webhook were switched on in production before the code handling them was deployed: password sign-in broke for every member and no email went out. Every PR that needs a dashboard change lists the steps in order, after the deploy.
- **Test environments must not inherit production's settings or data.** Test databases that copied production's configuration made the suite fail for reasons unrelated to the code. Here, where every environment _is_ production, the lesson is stronger: no writes from tests or experiments without the owner.
- **Verify settings through the API, but trust tested behaviour.** An API flag said one thing while the owner's real test showed another; the test was right. Report the discrepancy.
- **Don't promise what the product can't do.** A privacy policy first promised emails the site had no way to send. Legal and help pages describe the product as it is.

## Secrets and data

- **Never `source` an env file.** A URL containing `&` split in the shell and printed a production password, which then had to be rotated. Use `node --env-file`.
- **Never reuse what the owner pastes.** A real password-reset token from a chat message ended up in a unit test, in git, flagged by a secret scanner. Fixtures are always made up, and here the repo is public.
- **`git add -A` picks up everything.** Stage files by path. Scratch files, screenshots and env copies belong outside the repository.
- **Clean up test data with exact criteria**: delete by exact patterns, count before and after, in a transaction (here: only with the owner's agreement, since it's production).
- **Credits don't make a photo legal.** A provenance check found unlicensed images on a sister site; check licences when media matters.

## Git and the owner's machine

- **Never change the owner's checkout.** Switching branches in his working copy to read a file changed his state while he had work in progress. Read with `git show origin/dev:path`, work in a worktree.
- **Merge commits for mass rewrites**, so a reformat's hash can go in `.git-blame-ignore-revs`.
- **`Closes #n` only closes on the default branch.** Issues fixed on `dev` stay open until the release reaches `main`.

## Parallel agents

- **One build at a time, one port per agent, one owner per shared file and per schema change** ([orchestration](orchestration.md)).
- **Agents' reports are claims.** Review the diff where it matters; rerun checks you doubt.
- **Rebase after every merge**, with precise instructions.
- **Commit as you go**: a crashed session keeps worktrees but loses uncommitted work.

## Tests and CI

- **Flaky means a race.** Accessibility scans caught toasts mid-fade; a test reloaded before the server had finished a delete. Await the response, let animations settle, then assert.
- **Required checks must never end "cancelled"** on a release PR, or they block the merge.
- **Scanners flag shapes, not intent.** A generated test password in a template literal looked like a hardcoded secret. Build such values in a named helper.

## Communication

- **Say what's waiting on the owner first**, in order, with exact steps.
- **When you get something wrong, say so plainly**: what happened, the impact, the fix.
- **Label uncertainty.** "Measured" and "estimated" are different claims; "should work" is not "tested".
