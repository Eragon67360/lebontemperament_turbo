# Husky Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks.

## Pre-commit Hook

The pre-commit hook automatically:

1. **Bumps versions** - Automatically bumps versions for `@website` and `@admin` apps based on changed files
2. **Formats code** - Runs `npm run format` to format all code with Prettier
3. **Builds projects** - Runs `npm run build` to ensure everything compiles

### Version Bumping Logic

The version bumping script (`scripts/bump-versions.js`) automatically determines the version bump type:

- **Minor** - For API route changes, config changes, or new features (pages, components, API routes)
- **Patch** - For bug fixes, refactoring, and other changes

You can also manually specify the bump type:

```bash
npm run bump-versions major   # Force major version bump
npm run bump-versions minor   # Force minor version bump
npm run bump-versions patch   # Force patch version bump
```

The script only bumps versions for apps that have actual changes, so if you only modify files in `apps/website/`, only the website version will be bumped.

## Manual Version Bumping

To manually bump versions without committing:

```bash
npm run bump-versions
```

Or with a specific bump type:

```bash
npm run bump-versions minor
```
