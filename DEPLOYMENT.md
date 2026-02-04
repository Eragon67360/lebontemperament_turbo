# Vercel Deployment Guide (Turborepo)

Each app has its own `vercel.json` with the correct build filter. **You must set the Root Directory per project** so Vercel reads the right config.

## Configuration (required)

### Website project

| Setting              | Value                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| **Root Directory**   | `apps/website`                                                                  |
| **Build Command**    | _(from [apps/website/vercel.json](apps/website/vercel.json) – do not override)_ |
| **Output Directory** | _(Next.js default)_                                                             |

### Admin project

| Setting              | Value                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| **Root Directory**   | `apps/admin`                                                                |
| **Build Command**    | _(from [apps/admin/vercel.json](apps/admin/vercel.json) – do not override)_ |
| **Output Directory** | _(Next.js default)_                                                         |

## Important: Include source files outside Root Directory

Enable **"Include source files outside of the Root Directory in the Build Step"** for both projects:

1. Project Settings → Build and Deployment
2. Root Directory section
3. Enable the toggle

This allows the build to access root `node_modules` and shared packages (`@tailwindcss/postcss`, `next`, etc.).

## Do not use Root Directory = empty

If Root Directory is empty, both projects would read the same config and one would build the wrong app. Always use `apps/website` or `apps/admin`.
