# `@repo/eslint-config`

The shared ESLint flat configs of the monorepo (ESLint 10):

- `@repo/eslint-config/base` (`base.js`): `@eslint/js` and `typescript-eslint` rules, `eslint-config-prettier`, the Turbo plugin.
- `@repo/eslint-config/next-js` (`next.js`): `base` plus React, React Hooks and `@next/eslint-plugin-next`, for `apps/website` and `apps/admin`.
- `@repo/eslint-config/react-internal` (`react-internal.js`): `base` plus React and React Hooks, for React libraries.

Each workspace's ESLint config imports one of them; `npm run lint` runs them all through Turbo. The React version is set by hand in `next.js` and `react-internal.js`, because `eslint-plugin-react`'s auto-detection calls an API ESLint 10 removed (see [project.md](../../docs/agents/project.md#known-quirks)).
