# Le Bon Tempérament Monorepo

Turborepo monorepo for Le Bon Tempérament's digital ecosystem: a public website, an admin dashboard, and a mobile app, all backed by Supabase.

## Requirements

- **Node.js ≥ 24**, **npm 11** (workspaces: `apps/website`, `apps/admin`, `apps/e2e`, `packages/*`)
- **Flutter ≥ 3.9** (for the mobile app only)

## Apps

### `apps/website` — public site ([lebontemperament.com](https://www.lebontemperament.com))

Homepage, concerts, discover/gallery/contact pages, and a private members area (rehearsal calendar, work materials, member directory, documents).

- **Next.js 16** (App Router, Turbopack dev) · **React 19** · **TypeScript 7** · **Tailwind CSS v4**
- UI: HeroUI 3, motion, lucide-react
- Services: Supabase, Cloudinary (media), Google APIs (Calendar / Drive / Groups, Apps Script), nodemailer (SMTP), reCAPTCHA; donations go through a HelloAsso campaign
- Feature libs: FullCalendar, Mapbox GL + Google Maps, react-pdf, yet-another-react-lightbox, react-photo-album, react-h5-audio-player

### `apps/admin` — CMS dashboard (admin.lebontemperament.com)

Members and roles, the public site's content and settings (concerts and tours, stories, videos, announcements, joining and FAQ, site settings), the 40 years campaign, events and rehearsals, the Drive index, association documents, orders, signalements.

- **Next.js 16** · **React 19** · **TypeScript 7** · **Tailwind CSS v4**
- UI: shadcn/ui on Radix primitives, sonner
- Data: TanStack Query, react-hook-form + zod, papaparse (CSV), dnd-kit

### `apps/mobile_app` — Flutter app (iOS & Android)

Authentication, rehearsal/event calendar, file access, push notifications, offline cache, real-time updates.

- **Flutter** (Dart ≥ 3.9), Riverpod 3, go_router
- supabase_flutter + dio, shared_preferences (offline cache)
- Firebase Cloud Messaging + flutter_local_notifications (push), audioplayers, pdfx

## Packages

- **`@repo/domain`** — shared domain code used by both Next apps: generated Supabase types (`database.types.ts`), domain types (concerts, events, rehearsals, projects, anniversary, …), consts and utils. `npm run db:types` regenerates the DB types.
- **`@repo/eslint-config`** — shared ESLint flat configs (`base`, `next-js`, `react-internal`).
- **`@repo/typescript-config`** — shared tsconfigs (`base`, `nextjs`, `react-library`).

## Backend (Supabase)

- **Migrations** in `supabase/migrations` (2025-01 →): the newer tables and their policies; the core tables predate them (see [docs/agents/project.md](docs/agents/project.md#backend-supabase)). The staging project is rebuilt from `supabase/staging/`.
- **Edge functions** in `supabase/functions` (deployed by the owner, see [docs/agents/release.md](docs/agents/release.md#supabase)):
  - `sync-rehearsals-from-calendar` — Google Calendar → rehearsals (cron; OpenAI reads the events)
  - `sync-drive-index` — Google Drive → `drive_index_nodes`, reviewed from the admin (nightly cron + manual)
  - `generate-concert-event-data` — a concert's event data for Google, from the admin's text and the poster (OpenAI)
  - `send-push-notification`, `notify-public-concerts`, `notify-bug-report`, `check-ops-alerts` — FCM pushes: members' events, visitors' concerts, signalements, production alerts (cron)
  - Delivery rounds: `send-delivery-invitations`, `start-delivery-round`, `optimize-recipients-route`, `send-delivery-sms`, `send-delivery-complete-sms`, `check-eta-and-send-arrival-sms` (cron), `redeem-delivery-code`
  - Purges: `purge-bug-screenshots`, `purge-order-documents` (Storage objects that SQL can't delete)

### Database overview

Core: `profiles`, `groups`, `concerts`, `events`/`event_documents`, `rehearsals`, `projects`, `programs`, `cas`, `tours`, `activities`, `notifications`, `youtube_links`, `files`/`folders` (old Storage explorer)
Managed in the admin: `anniversary_*` (the 40 years CMS), `site_documents`/`document_collections`/`content_revisions`, `general_assemblies`, `site_announcements`, `faq_items`/`joining_slots`, `site_settings`, `feature_flags`
Other: `bug_reports`/`bug_messages`, `donations`/`donors`/`donation_receipt_seq` (Stripe-era records), `deliveries`/`delivery_recipients`/`delivery_devices`/`delivery_code_attempts`, `order_sales`/`order_products`/`orders`/`order_items`/`order_payments`, `rehearsal_sync_logs`, `drive_folders`/`drive_index_nodes`/`drive_sync_runs`, `push_devices`/`ops_alerts`, `public_concert_pushes`, `mailing_list_comparisons`/`mailing_list_exceptions`

## Scripts

```bash
npm run dev                     # start all apps (turbo): website on :3000, admin on :3002
npm run dev -- --filter=website # or: admin
npm run build                   # build all apps
npm run lint                    # lint all packages
npm run check-types             # typecheck all packages
npm run format                  # prettier
npm test -w website             # unit tests of one workspace (also -w admin, -w @repo/domain)
npm run test:e2e                # Playwright against deployed URLs (apps/e2e; read docs/agents/safety.md first)
npm run env:check               # the env/ templates against the names the code reads
npm run db:types                # regenerate Supabase types (@repo/domain)
npm run release:bump            # bump the version across apps (version.json), on the release PR only
npm run test:rehearsal-sync     # test the calendar sync function (see scripts/README.md)
```

## Setup

1. `npm ci` (Node 24, npm 11; installs the Husky pre-commit hook, which formats staged files)
2. Env files: `apps/website/.env.local` and `apps/admin/.env.local` with the variables the templates in [`env/`](env/README.md) list for the dev targets (`website.dev.env`, `admin.dev.env`); the values come from Proton Pass or `vercel env pull`, which point at the staging database. `apps/mobile_app/.env` follows its `.env.example`. Never commit any of them.
3. `npm run dev`

## Project structure

```
├── apps
│   ├── website/        # Public Next.js site
│   ├── admin/          # Admin Next.js dashboard
│   ├── e2e/            # Playwright suite (runs against deployed URLs)
│   └── mobile_app/     # Flutter app (not a turbo workspace)
├── packages
│   ├── domain/         # @repo/domain — shared types & utils
│   ├── eslint-config/
│   └── typescript-config/
├── supabase/           # migrations + edge functions
├── scripts/            # version bump, env sync, media, read-only checks (scripts/README.md)
├── turbo.json
└── package.json
```

## Deployment

Website and admin are deployed on **Vercel** — see [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel project configuration. Android builds go to Google Play's internal track through `.github/workflows/android-build-release.yml` on `main`, iOS builds to TestFlight through `ios-testflight.yml` after the owner's approval ([docs/agents/release.md](docs/agents/release.md)).

## Contributing

1. Branch from `dev` and open a PR into `dev` ([docs/agents/workflow.md](docs/agents/workflow.md)); `main` is production
2. `npm run lint && npm run check-types && npm run format`, plus the tests and builds of what you touched ([docs/agents/quality-gates.md](docs/agents/quality-gates.md))
3. CI (`.github/workflows/ci.yml`) runs lint, types, tests, builds and the Flutter checks on every PR
