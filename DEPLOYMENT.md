# Vercel Deployment Guide (Turborepo)

Both Vercel projects build from the **repository root**, with a Turbo filter per app. _Measured on 2026-10-02 through the Vercel API._

## Configuration (both projects)

| Setting                | Website (`lebontemperament`)   | Admin (`lebontemperament-admin`) |
| ---------------------- | ------------------------------ | -------------------------------- |
| **Root Directory**     | _(empty: repository root)_     | _(empty: repository root)_       |
| **Build Command**      | `turbo build --filter=website` | `turbo build --filter=admin`     |
| **Output Directory**   | `apps/website/.next`           | `apps/admin/.next`               |
| **Install Command**    | `npm ci`                       | `npm ci`                         |
| **Node.js**            | 24.x                           | 24.x                             |
| **Ignored Build Step** | none                           | none                             |

## `vercel.json` files are not read

Vercel only reads `vercel.json` from the Root Directory, which is the repository root here. `apps/website/vercel.json` and `apps/admin/vercel.json` are therefore never read: change the settings in the Vercel project, not in those files. Build skipping and the dead `vercel.json` files are tracked in #366.

## Deployment protection

Since 2026-10-02 both projects use Vercel Authentication with `all_except_custom_domains`:

- Staging (`dev.`, `admin-dev.`), every preview and every generated production deployment URL need a Vercel login.
- `www.lebontemperament.com` and `admin.lebontemperament.com` stay public.
- The e2e suite uses one automation bypass secret, valid for both projects.
- Production deployments are retained 36,500 days, so old builds are now behind the protection too.
