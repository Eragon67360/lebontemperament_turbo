# Le Bon Tempérament Monorepo

Turborepo monorepo for Le Bon Tempérament's digital ecosystem: a public website, an admin dashboard, and a mobile app, all backed by Supabase.

## Requirements

- **Node.js ≥ 24**, **npm 11** (workspaces: `apps/website`, `apps/admin`, `packages/*`)
- **Flutter ≥ 3.9** (for the mobile app only)

## Apps

### `apps/website` — public site ([lebontemperament.com](https://www.lebontemperament.com))

Homepage, concerts, discover/gallery/contact pages, and a private members area (rehearsal calendar, work materials, member directory, documents).

- **Next.js 16** (App Router, Turbopack dev) · **React 19** · **TypeScript 7** · **Tailwind CSS v4**
- UI: HeroUI 3, motion, GSAP, lucide-react
- Services: Supabase, Stripe (donations), Cloudinary (media), Google APIs (Calendar / Drive / Groups), nodemailer, reCAPTCHA
- Feature libs: FullCalendar, Mapbox GL + Google Maps, react-pdf, yet-another-react-lightbox, react-photo-album, react-h5-audio-player

### `apps/admin` — CMS dashboard (admin.lebontemperament.com)

User & role management, public-site content (projects, concerts, media library, contact), event/rehearsal management, Google Drive file integration, bug reports, analytics.

- **Next.js 16** · **React 19** · **TypeScript 7** · **Tailwind CSS v4**
- UI: shadcn/ui on Radix primitives, sonner
- Data: TanStack Query, react-hook-form + zod, papaparse (CSV), dnd-kit

### `apps/mobile_app` — Flutter app (iOS & Android)

Authentication, rehearsal/event calendar, file access, push notifications, offline cache, real-time updates.

- **Flutter** (Dart ≥ 3.9), Riverpod 3, go_router
- supabase_flutter + dio, Hive + shared_preferences (offline)
- Firebase Cloud Messaging + flutter_local_notifications (push), audioplayers, pdfx

## Packages

- **`@repo/domain`** — shared domain code used by both Next apps: generated Supabase types (`database.types.ts`), domain types (concerts, events, rehearsals, projects, anniversary, …), consts and utils. `npm run db:types` regenerates the DB types.
- **`@repo/ui`** — shared React component library (minimal; apps mostly carry their own components).
- **`@repo/eslint-config`** — shared ESLint flat configs (`base`, `next`, `react-internal`).
- **`@repo/typescript-config`** — shared tsconfigs (`base`, `nextjs`, `react-library`).

## Backend (Supabase)

- **Migrations** in `supabase/migrations` — members/profiles, anniversary CMS + realtime, feature flags, donations (donors, receipts), delivery tracking (deliveries, recipients, routes, ETA), rehearsal calendar sync.
- **Edge functions** in `supabase/functions`:
  - `sync-rehearsals-from-calendar` — Google Calendar → rehearsals sync (cron)
  - `send-push-notification` — FCM push on new events
  - Delivery round: `start-delivery-round`, `optimize-recipients-route`, `send-delivery-sms`, `send-delivery-complete-sms`, `check-eta-and-send-arrival-sms` (cron)

### Database overview

Core: `profiles`, `groups`, `concerts`, `events`, `rehearsals`, `projects`, `programs`, `files`/`folders`, `cas`, `tours`, `activities`, `notifications`, `youtube_links`
Anniversary CMS: `anniversary_*` (hero, stats, timeline, memories, photos, videos, …)
Other: `bug_reports`/`bug_messages`, `feature_flags`, `donations`/`donors`, `deliveries`/`delivery_recipients`, `rehearsal_sync_logs`

## Scripts

```bash
npm run dev                  # start all apps (turbo)
npm run dev --filter=website # or: admin
npm run build                # build all apps
npm run lint                 # lint all packages
npm run check-types          # typecheck all packages
npm run format               # prettier
npm run db:types             # regenerate Supabase types (@repo/domain)
npm run bump-version         # bump version across apps (version.json)
npm run test:rehearsal-sync  # test the calendar sync function (see scripts/README.md)
```

## Setup

1. `npm install`
2. Create env files:
   - `apps/website/.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`, Google API keys, Stripe, Cloudinary (see `turbo.json` build env for the full list)
   - `apps/admin/.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `apps/mobile_app/.env` — `SUPABASE_URL`, `SUPABASE_ANON_KEY`
3. `npm run dev`

## Project structure

```
├── apps
│   ├── website/        # Public Next.js site
│   ├── admin/          # Admin Next.js dashboard
│   └── mobile_app/     # Flutter app (not a turbo workspace)
├── packages
│   ├── domain/         # @repo/domain — shared types & utils
│   ├── ui/             # @repo/ui — shared components
│   ├── eslint-config/
│   └── typescript-config/
├── supabase/           # migrations + edge functions
├── scripts/            # version bump, sync tests
├── turbo.json
└── package.json
```

## Deployment

Website and admin are deployed on **Vercel** — see [DEPLOYMENT.md](DEPLOYMENT.md) for the required per-project configuration. The mobile app ships via App Store Connect / Google Play Console.

## Contributing

1. Create a branch, make your changes
2. `npm run lint && npm run check-types`
3. Open a PR
