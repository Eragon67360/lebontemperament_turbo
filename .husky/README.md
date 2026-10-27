# Husky Git hooks

`npm ci` (or `npm install`) installs [Husky](https://typicode.github.io/husky/) through the root `prepare` script, skipped on CI and Vercel. One hook exists.

## Pre-commit

`.husky/pre-commit` runs `npx lint-staged`: `prettier --write` on the **staged** `ts`, `tsx`, `js`, `mjs`, `md`, `json` and `css` files (the `lint-staged` key in the root `package.json`), which re-stages those files. It stages nothing else, builds nothing, bumps no version and takes seconds. A worktree without `node_modules` has no `.husky/_` directory, so the hook does not run there.

Lint, type checks, tests and builds are yours to run before a PR ([quality gates](../docs/agents/quality-gates.md)); CI runs them on the PR. Versions are bumped on the release PR only, with `npm run release:bump` ([release](../docs/agents/release.md#preparing-a-release)).
