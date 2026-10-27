# `website`: the public site and the members area

[www.lebontemperament.com](https://www.lebontemperament.com): concerts, discover, gallery, donations, joining, the 40 years programme, the legal pages, and the members area (`/membres`). Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS v4, HeroUI 3.

## Running it

From the repository root, after `npm ci` and the env files ([env/README.md](../../env/README.md)):

```bash
npm run dev -- --filter=website   # http://localhost:3000
npm test -w website               # the unit tests (tsx, no browser)
npx turbo build --filter=website
```

The site reads the Supabase project its `.env.local` names: staging (`website-staging`) for development, never production ([safety](../../docs/agents/safety.md)).

## Before changing anything

- [docs/agents/project.md](../../docs/agents/project.md): routes, tables, services and quirks.
- [docs/agents/design-guardrails.md](../../docs/agents/design-guardrails.md): the look stays (teal HeroUI, Roboto; « Les Pupitres » in the members area; « Le Programme » on `/40-ans`).
- [AGENTS.md](AGENTS.md): Next.js 16 changed several APIs; read `node_modules/next/dist/docs/` before using one from memory.
- The mobile app also calls some routes under `app/api/` (`contact/mobile`, `documents`, `drive/*`, `joining`, `profile/photo`): keep their request and response shapes, since installed versions can't follow a change.
