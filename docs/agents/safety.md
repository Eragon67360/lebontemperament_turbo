# Safety: production, data and secrets

This ecosystem holds members' personal data (profiles, phone numbers, voices and groups), donors' data and receipts, delivery addresses and live driver locations, and it can reach every member's phone. Most of the ways an agent can hurt it are not code bugs but **writes, messages and payments in the wrong place**. Read this before any command that writes or sends.

## One database for everything

_Measured on 2026-10-01_: in both Vercel projects, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` each have **one value for Development, Preview and Production**. So:

- **Staging** (`dev.lebontemperament.com`, `admin-dev.lebontemperament.com`), **PR previews** and **local `npm run dev`** all read and write the production database.
- The **service-role key** (bypasses row-level security) is available locally and in previews.
- There is no staging or development Supabase project to test schema changes on.

Until that changes, treat every environment as production: no test sign-ups, no test concerts, no "quick check" inserts, no deletes, unless the owner agrees to that specific write. **Target state** (an improvement to propose): a separate Supabase project or branch for development and staging, with its own keys in Vercel's Development and Preview targets, seeded with fake data.

## What writes or sends, and where

| Action                                                                              | Effect                                                                        | Rule                                                                       |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Any form or admin action on staging, previews or local dev                          | Production rows                                                               | Read-only unless the owner agrees                                          |
| `apps/e2e` `concerts-write.spec.ts` (and its teardown sweep)                        | Creates and deletes `E2E_` concerts in production                             | Don't add write tests without the owner; namespace them `E2E_`             |
| `npm run test:rehearsal-sync` (`scripts/test-rehearsal-sync.ts`)                    | Calls the deployed sync function in test mode: **writes real rehearsal rows** | Owner approval each time                                                   |
| `send-push-notification`, anything creating `events`/`notifications`                | Push notifications to members' phones                                         | Never trigger from tests or experiments                                    |
| Delivery-round functions (`send-delivery-sms`, `check-eta-and-send-arrival-sms`, …) | Real SMS through Twilio (costs money, reaches real people)                    | Never invoke                                                               |
| Contact, subscription, anniversary forms                                            | Real emails through the association's mailbox                                 | Use `@example.com` addresses and stop before submit, as the e2e suite does |
| Donations (`/don`, HelloAsso)                                                       | Payments and tax receipts, handled by HelloAsso (nothing in this repo)        | Test only in HelloAsso's own sandbox; never on the live campaign           |
| Google Calendar, Drive, Groups APIs                                                 | The association's real calendar, files and mailing list                       | Read-only unless the owner agrees                                          |
| Cloudinary uploads and deletes                                                      | Shared media library                                                          | Ask before deleting anything                                               |
| `npm run db:types`                                                                  | Reads the remote schema (safe), rewrites `database.types.ts`                  | Fine                                                                       |
| Supabase migrations and function deploys                                            | Production schema and functions                                               | Owner-run or owner-approved, in order ([release](release.md#supabase))     |

Any bulk change or deletion (when approved): count first, restrict by the narrowest exact criteria, run in a transaction, recount after, report the numbers. If a permission prompt or the safety classifier refuses a write, **stop** and hand the owner the exact command and why; don't find another route to the same outcome.

## Secrets

- **The repository is public.** Anything committed is published, including in history. Never commit `.env*` files, keys, tokens, service-account JSON, keystores or personal data. Check `git status` and `git show --stat HEAD` around every commit (the pre-commit hook runs `git add -A`).
- **Secret scanning and push protection are enabled** (since 2026-10-02). They are a net, not a guarantee: still check every commit and diff for secrets before you push.
- Never print, echo or paste a secret: not in the terminal, issues, PRs or the chat. Read values only inside a process (`node --env-file=apps/website/.env.local -e '…'`) and print harmless facts (a hostname, a length, a boolean). Never `source` an env file.
- Vercel: list variables by **name and target** only (`vercel env ls`, or the API without decrypting). Setting values is the owner's job; give him exact steps.
- **`NEXT_PUBLIC_*` variables are sent to every browser** that runs code referencing them. Nothing secret may carry that prefix. Today `NEXT_PUBLIC_BURNER_USERNAME` / `NEXT_PUBLIC_BURNER_PASSWORD` (SMTP mailbox) are only read by server routes (`app/api/contact`, `contact/mobile`, `subscribe`, `anniversary/submit-memory`), so they are _estimated_ not to reach a bundle, but one client-side reference would publish them: rename to `SMTP_USER` / `SMTP_PASSWORD` (server-only, pending). `NEXT_PUBLIC_ADMIN_PASSWORD` was deleted from Vercel on 2026-10-01 (the password is used nowhere else); the `SMTP_*` rename is tracked in #321.
- The mobile app ships `SUPABASE_URL` and the **anon** key by design; it must never contain the service-role key or Twilio credentials (`apps/mobile_app/.env.example` lists `TWILIO_*`: check whether the app actually needs them; SMS sending belongs to edge functions).
- If a secret leaks, tell the owner at once: what, where, since when, which key to rotate where. Don't rewrite history on your own.

## Third-party settings

Vercel, Supabase, Stripe, Google Cloud, Firebase, Twilio, Cloudinary, GitHub, Google Play, App Store Connect, DNS: reading settings through an API to verify something is fine; changing them needs the owner's explicit OK for that change. **Code first, settings after**: deploy the code that handles a setting before the setting is switched on, write the order down in the PR, and verify each step as the owner completes it.

## Security review checklist

Use it on every change touching data access, auth, payments, uploads or user-submitted content.

- **RLS**: every table exposed to the anon key or a user session has RLS enabled and policies that match the roles (`user`, `admin`, `superadmin`) and groups. The core tables predate `supabase/migrations`, so their policies must be read from the database (owner runs the query, or you read-only with approval) before you rely on them.
- **Service-role key**: server-side only (route handlers, server actions, edge functions), never in client components or the mobile app, and every use is preceded by an explicit authorization check (a service-role query ignores RLS).
- **Auth** (`@supabase/ssr`): sessions checked server-side in `proxy.ts` / route handlers; admin pages check `admin` / `superadmin`, not just "signed in"; role changes only by `superadmin` (or as the code defines).
- **API routes** (`apps/website/app/api/**`, `apps/admin/app/api/**`): authentication, input validation, reCAPTCHA where abuse is possible, no user enumeration, rate limits where cheap to abuse (Vercel Firewall), consistent errors without stack traces.
- **Stripe** (CD catalogue route only, being removed, #318): amounts computed server-side, no secret key in client code.
- **Deliveries**: `public_token` tracking links expire (`expires_at`), expose only what the recipient needs, and stop sharing the driver's location after the round.
- **Uploads**: type and size limits; images through Cloudinary; no SVG with scripts.
- **Disclosure**: the repo is public. File security issues by impact and fix, without step-by-step exploits; publish details only after the fix is live.
