# The admin dashboard as a standalone Next.js server, for the self-hosted
# deployments (Coolify, see DEPLOYMENT.md). Build from the repository root:
#
#   docker build -f apps/admin/Dockerfile -t lbt-admin .
#
# Coolify passes the application's build-time variables as build arguments:
# each one the build reads is declared below (an undeclared one never reaches
# `next build`). The same variables reach the running container at runtime.

ARG NODE_IMAGE=node:24-bookworm-slim

# 1. Only the workspaces the admin needs (turbo prune), so that the install
#    layer below stays cached until a package.json or the lockfile changes.
FROM ${NODE_IMAGE} AS prune
WORKDIR /repo
COPY . .
RUN npx --yes turbo@2.11.7 prune admin --docker

# 2. Install and build.
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1
COPY --from=prune /repo/out/json/ ./
# CI=1 skips the root `prepare` script (Husky's git hooks, useless here).
RUN CI=1 npm ci --no-audit --no-fund
COPY --from=prune /repo/out/full/ ./

# Deployment environment: "production" or "preview" (staging). The server
# reads it at runtime (deployEnv): member lists, invitation links.
ARG APP_ENV
# Public values, inlined into the browser bundles at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WEBSITE_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
# Server values: pages prerendered at build time read them, as on Vercel.
# They stay in this stage; the image that runs (below) has none of them.
ARG SUPABASE_SERVICE_ROLE_KEY
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG GOOGLE_APPS_SCRIPT_URL
ARG GOOGLE_APPS_SCRIPT_KEY
ARG GOOGLE_SERVICE_ACCOUNT_JSON
ARG ROSTER_SHEET_ID
ARG ROSTER_SHEET_RANGE
ARG REVALIDATE_SECRET
ARG CRON_SECRET

RUN BUILD_STANDALONE=1 npx turbo run build --filter=admin

# 3. The image that runs: the standalone server, its static files and public/.
FROM ${NODE_IMAGE} AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
# Next's cache (optimised images, fetch cache). Mount a volume here so that
# images survive a deployment instead of being fetched again from Supabase.
RUN mkdir -p apps/admin/.next/cache && chown nextjs:nodejs apps/admin/.next/cache
USER nextjs
EXPOSE 3000
# A static file: no session, no database.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/favicon.ico').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "apps/admin/server.js"]
