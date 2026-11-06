# Deployment Guide (Turborepo)

Both sites are moving from Vercel to a self-hosted server (Hetzner Cloud + Coolify) (owner's decision, 2026-11-05). **Staging moved on 2026-11-06**: `dev.lebontemperament.com` and `admin-dev.lebontemperament.com` point to the server. Production follows once staging has run for a week. Until then, Vercel builds `main` as described in the first sections (it still builds `dev` too, though no domain points there any more); the [self-hosted section](#self-hosted-hetzner--coolify) describes the new setup.

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

## The bare domain

`lebontemperament.com` must be **connected to Production** in the website project's domains, not set to « Redirect to www.lebontemperament.com ». A domain-level redirect answers before the site runs, so it also redirects `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association`, and Android App Links and iOS Universal Links refuse a redirected file (Play Console then lists the bare domain as not verified). The site itself sends every other path of the bare domain to `www` with a 308 (first rule of `redirects()` in `apps/website/next.config.js`).

## No `vercel.json`

Vercel only reads `vercel.json` from the Root Directory, which is the repository root here, and the repository has none: every setting lives in the Vercel project (the table above). The old `apps/website/vercel.json` and `apps/admin/vercel.json` were never read and were deleted (#366).

## Deployment protection

Since 2026-10-02 both projects use Vercel Authentication with `all_except_custom_domains`:

- Every preview and every generated production deployment URL need a Vercel login. Staging (`dev.`, `admin-dev.`) left Vercel on 2026-11-06 and asks for HTTP basic auth instead (see [Coolify applications](#coolify-applications)).
- `www.lebontemperament.com` and `admin.lebontemperament.com` stay public.
- The e2e suite uses one automation bypass secret, valid for both projects.
- Production deployments are retained 36,500 days, so old builds are now behind the protection too.

## Environment variables

Values live in Proton Pass and are pushed to both projects (and to GitHub secrets) from the owner's Mac with `npm run env:push`; the templates in [`env/`](env/README.md) say which variable goes to which environment. Change a value in Proton Pass, not in the Vercel dashboard: the next push overwrites dashboard edits. After a push, force the build as described above.

## Self-hosted (Hetzner + Coolify)

One Hetzner Cloud server runs [Coolify](https://coolify.io), which builds each app from its Dockerfile when its branch changes and serves it behind Traefik with Let's Encrypt certificates. The server's own set-up (firewall, SSH, swap, Coolify) is outside this repository.

### How an app is built

`apps/website/Dockerfile` and `apps/admin/Dockerfile` build from the **repository root**:

1. `turbo prune <app> --docker` keeps only the workspaces the app needs.
2. `npm ci`, then `turbo run build --filter=<app>` with `BUILD_STANDALONE=1`, which turns on `output: "standalone"` in the app's `next.config.js` (Vercel builds leave it off).
3. The final image holds only `.next/standalone`, `.next/static` and `public/`, runs `node apps/<app>/server.js` on port 3000 as a non-root user, and checks `/favicon.ico` for health.

Coolify passes the application's build-time variables as build arguments, and a Dockerfile only sees the arguments it declares: **a variable the build reads must have an `ARG` line in the app's Dockerfile.** Server values stay in the build stage; the image that runs gets its variables from Coolify at runtime.

To build one locally: `docker build -f apps/website/Dockerfile -t lbt-website .` from the repository root.

### Which deployment is production

Vercel sets `VERCEL_ENV`; the self-hosted apps set **`APP_ENV`** (`production` or `preview`) in Coolify, as a build-time and runtime variable. Code asks `deployEnv()` or `isProductionDeploy()` from `@repo/domain/utils/deployEnv`, which reads `APP_ENV` first and falls back to `VERCEL_ENV`; `apps/website/next.config.js` does the same inline. Never test `VERCEL_ENV` directly in new code.

### Coolify applications

| Setting             | Value                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source              | GitHub App, `Eragon67360/lebontemperament_turbo`; branch `dev` (staging) or `main` (production)                                                                                                                    |
| Build pack          | Dockerfile; base directory `/`; Dockerfile `/apps/website/Dockerfile` or `/apps/admin/Dockerfile`                                                                                                                  |
| Port                | 3000                                                                                                                                                                                                               |
| Watch paths         | `apps/<app>/**`, `packages/**`, `package.json`, `package-lock.json`, `turbo.json`, `.dockerignore`                                                                                                                 |
| Build arguments     | Coolify's "Inject build args to Dockerfile" **off**: the Dockerfiles declare their own `ARG`s in the build stage only, and the injection would add every variable after each `FROM`, including the image that runs |
| Variables           | `APP_ENV`, plus the app's template in `env/`; build-time **and** runtime                                                                                                                                           |
| Persistent storage  | a volume on `/app/apps/<app>/.next/cache` (optimised images survive a deployment)                                                                                                                                  |
| Staging only        | project `Le Bon Temperament`, environment `staging`: `website-staging` (`dev.`) and `admin-staging` (`admin-dev.`), ids in `env/targets.json`; auto-deploy from `dev`; noindex; HTTP basic auth (below)            |
| Website, production | `www` and the bare domain on the same application, with Coolify's www redirect **off**: the bare domain must serve `/.well-known/*` itself (see [The bare domain](#the-bare-domain))                               |

**Staging's basic auth.** The login lives in Proton Pass, `LBT Staging / E2E` (`basic_auth_user`, `basic_auth_password`); the e2e suite reads it from the GitHub secrets `E2E_BASIC_AUTH_USER` and `E2E_BASIC_AUTH_PASSWORD`. Keep the password to **31 characters at most**: Coolify 4.6.0 fails to save a longer one, the API answering 500 and the dashboard silently dropping the username and password (_measured_ 2026-11-06). Basic auth only applies once both are stored, and after a redeployment.

The client IP reaches the apps in `x-real-ip` and `x-forwarded-for`, set by Traefik as Vercel does, so form rate limiting (`apps/website/lib/formRateLimit.ts`) works unchanged. There are no per-PR previews on the server: CI still runs the gates on every PR, and staging is the `dev` branch.
