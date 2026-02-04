# Vercel Deployment Guide (Turborepo)

This monorepo uses **shared dependencies** at the root. To preserve that setup, use one of these approaches:

## Option A: Root Directory = empty (recommended)

Use the **repository root** as Root Directory so Vercel has full access to the workspace and shared packages.

### Website project

1. **Root Directory**: Leave empty (or set to `.`)
2. **Build Command**: `turbo build --filter=website` (override in dashboard)
3. **Output Directory**: `apps/website/.next` (override in dashboard)
4. **Install Command**: `npm ci` (default, runs from repo root)

The root [vercel.json](vercel.json) is pre-configured for the website project.

### Admin project

1. **Root Directory**: Leave empty (or set to `.`)
2. **Build Command**: `turbo build --filter=admin` (override in dashboard)
3. **Output Directory**: `apps/admin/.next` (override in dashboard)
4. **Install Command**: `npm ci` (default)

---

## Option B: Root Directory = app folder

If you prefer Root Directory = `apps/website` or `apps/admin`:

1. Enable **"Include source files outside of the Root Directory in the Build Step"** in Project Settings → Root Directory
2. This allows the build to access root `node_modules` and shared packages
3. Use the app-specific [apps/website/vercel.json](apps/website/vercel.json) or [apps/admin/vercel.json](apps/admin/vercel.json)

---

## Ignored Build Step (optional)

For both projects, set **Ignored Build Step** to skip deployments when unchanged:

```
npx turbo-ignore --fallback=HEAD^1
```
