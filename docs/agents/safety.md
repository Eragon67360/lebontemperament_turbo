# Safety: production, data and secrets

This ecosystem holds members' personal data (profiles, phone numbers, voices and groups), donors' data and receipts, delivery addresses and live driver locations, and it can reach every member's phone. Most of the ways an agent can hurt it are not code bugs but **writes, messages and payments in the wrong place**. Read this before any command that writes or sends.

## Production and staging databases

_Measured on 2026-10-07_: in both Vercel projects, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` have one value for Production and another for Preview and Development (#363). So:

- **Production** (`www.`, `admin.`), the **mobile apps**, the **edge functions** and the **cron jobs** use the production project `website` (ref `fsklunxplbbtzgurwqmc`).
- **Staging** (`dev.lebontemperament.com`, `admin-dev.lebontemperament.com`), **PR previews** and **`vercel env pull`** use `website-staging` (ref `cevuqyhwtzjujxsocxkb`): production's structure with fake data, no edge functions, no crons, no vault secrets ([supabase/staging/README.md](../../supabase/staging/README.md)).
- Writes to `website-staging` are fine for tests; it is still not a place for real member data. Its accounts are test accounts (the e2e account is an admin there).
- **Check which project a command will hit before it writes.** A local `.env` written before 2026-10-07, a script given production keys, and the Supabase MCP on `website` all write to production. Production stays read-only from everywhere but production: a production write is a single-purpose script, run after the owner's go.
- The other services are **not** split: Google Calendar, Drive and Groups, Cloudinary and the SMTP mailbox use the same accounts in every environment, so the rows below still apply on staging.

## What writes or sends, and where

| Action                                                                              | Effect                                                                        | Rule                                                                       |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Any form or admin action on production, or with production keys                     | Production rows                                                               | Read-only unless the owner agrees                                          |
| `apps/e2e` `concerts-write.spec.ts` (and its teardown sweep)                        | Creates and deletes `E2E_` concerts in the database of the env that runs it   | Don't add write tests without the owner; namespace them `E2E_`             |
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

- **The repository is public.** Anything committed is published, including in history. Never commit `.env*` files, keys, tokens, service-account JSON, keystores or personal data. Check `git status` and `git show --stat HEAD` around every commit (stage files by path, never `git add -A`).
- **Secret scanning and push protection are enabled** (since 2026-10-02). They are a net, not a guarantee: still check every commit and diff for secrets before you push.
- Never print, echo or paste a secret: not in the terminal, issues, PRs or the chat. Read values only inside a process (`node --env-file=apps/website/.env.local -e '…'`) and print harmless facts (a hostname, a length, a boolean). Never `source` an env file.
- Vercel: list variables by **name and target** only (`vercel env ls`, or the API without decrypting). Setting values is the owner's job; give him exact steps.
- **`NEXT_PUBLIC_*` variables are sent to every browser** that runs code referencing them. Nothing secret may carry that prefix. The SMTP mailbox credentials were renamed for that reason: the code reads the server-only `SMTP_USER` / `SMTP_PASSWORD` (#321), and the old `NEXT_PUBLIC_BURNER_*` variables are deleted from Vercel once that release is live. `NEXT_PUBLIC_ADMIN_PASSWORD` was deleted from Vercel on 2026-10-01 (the password is used nowhere else).
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
