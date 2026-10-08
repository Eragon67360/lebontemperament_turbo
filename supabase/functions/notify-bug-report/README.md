# Signalement pushes

This Edge Function pushes signalements to phones through the mobile app (FCM).

| Event                                  | Who gets a push                    | Title                                  |
| -------------------------------------- | ---------------------------------- | -------------------------------------- |
| A member sends a report (app or admin) | every superadmin except the author | « Nouveau signalement »                |
| A superadmin answers                   | the report's author                | « Réponse à votre signalement »        |
| The author answers back                | every superadmin except the author | « Nouveau message sur un signalement » |

The body names the sender and the report's title, never the text of a message (lock screens are seen by others). Rules and texts live in `plan.ts`, covered by `plan_test.ts`.

Each push carries `data: { type: "report", id: <report id> }`: the app opens the conversation on a tap. On Android it goes to the channel `bug_reports` (« Signalements »), which the app creates at start-up; an older app files it under its default channel.

## Caller

The database trigger `notify_bug_report_push` (migration `20261008090000_app_bug_reports.sql`) on `bug_reports` and `bug_messages` inserts, with the internal secret (`x-internal-secret`) and the body `{ "kind": "report" | "message", "id": "<row id>" }`. The function reads the rows with the service role, so a caller can't choose who is pushed or what it says. Like the other push trigger, it does nothing without the Vault secrets (`project_url`, `anon_key`, `internal_function_secret`), so staging never pushes, and `SET LOCAL app.silence_push = 'true'` silences it for a transaction.

## Who has a phone registered

`push_devices`, written by the app through `register_push_device(p_token, p_platform)` at every launch with a session (and on token refresh), and `unregister_push_device(p_token)` on sign-out. Since `20261008090000` every signed-in member's phone is kept (before: superadmins only). Tokens FCM reports as unregistered are deleted at send time.

## Setup

Secrets already exist for the other functions: `FIREBASE_SERVICE_ACCOUNT_JSON`, `INTERNAL_FUNCTION_SECRET`. Apply the migration, then `supabase functions deploy notify-bug-report`. The function keeps the gateway's default `verify_jwt`: the trigger sends the anon key as bearer, and the real check is the internal secret.

Tests: `npx -y deno test --allow-env --node-modules-dir=none supabase/functions/notify-bug-report/`.
