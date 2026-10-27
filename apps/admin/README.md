# `admin`: the dashboard

[admin.lebontemperament.com](https://admin.lebontemperament.com): members and roles, concerts and tours, the public site's content and settings, the 40 years campaign, events and rehearsals, the Drive index, association documents, orders, signalements. Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS v4, shadcn/ui on Radix, TanStack Query, react-hook-form + zod. Admin and superadmin accounts only.

## Running it

From the repository root, after `npm ci` and the env files ([env/README.md](../../env/README.md)):

```bash
npm run dev -- --filter=admin
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

`npm test -w admin` runs the unit tests (`scripts/run-tests.mjs` finds every `*.test.ts(x)`, about 90 s); `npx turbo build --filter=admin` builds. The dashboard reads the Supabase project its `.env.local` names: staging (`website-staging`) for development, never production ([safety](../../docs/agents/safety.md)).

## Before changing anything

- [docs/agents/design-guardrails.md](../../docs/agents/design-guardrails.md): direction B « Atelier guidé », tokens only, the primitives of `components/ui`; the review page `/dashboard/design-system` shows every primitive and state.
- [docs/agents/project.md](../../docs/agents/project.md): tables, services and quirks; the navigation tree lives in `lib/navigation.ts`.
- [AGENTS.md](AGENTS.md): Next.js 16 changed several APIs; read `node_modules/next/dist/docs/` before using one from memory.
