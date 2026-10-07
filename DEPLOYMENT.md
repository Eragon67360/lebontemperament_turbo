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
| **Ignored Build Step** | `npx turbo-ignore website`     | `npx turbo-ignore admin`         |

## Skipped builds and forcing a redeploy

`turbo-ignore` cancels a deployment when nothing the app depends on changed since the branch's last successful deployment (docs, `supabase/`, the mobile app). Vercel then shows it as Canceled, and a Redeploy from the dashboard is cancelled the same way, because the check runs again on the same commit (_measured_ 2026-10-07: four dev deployments of both projects cancelled after a docs-only merge). So after changing environment variables, force the build with a commit whose message contains `[vercel deploy]`: for example, merge the next PR into `dev` with `[vercel deploy]` in the merge commit title. `[vercel skip]` does the opposite.

## `vercel.json` files are not read

Vercel only reads `vercel.json` from the Root Directory, which is the repository root here. `apps/website/vercel.json` and `apps/admin/vercel.json` are therefore never read: change the settings in the Vercel project, not in those files. Build skipping and the dead `vercel.json` files are tracked in #366.

## Deployment protection

Since 2026-10-02 both projects use Vercel Authentication with `all_except_custom_domains`:

- Staging (`dev.`, `admin-dev.`), every preview and every generated production deployment URL need a Vercel login.
- `www.lebontemperament.com` and `admin.lebontemperament.com` stay public.
- The e2e suite uses one automation bypass secret, valid for both projects.
- Production deployments are retained 36,500 days, so old builds are now behind the protection too.
