# Delivery codes in the app

Part of #593. A delivery recipient follows their delivery in the app without an account: the SMS carries a personal code (`K7MP-4XQ9`, column `delivery_recipients.code`) and the link `https://www.lebontemperament.com/l/<code>`. The link opens the app when it is installed (universal link / app link), the website's `/l/<code>` page otherwise; in the app, « À propos › J’ai un code » takes the code by hand.

## What it does

| Request (POST, JSON)                                                        | Answer                                                                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `{ "code": "K7MP-4XQ9", "fcm_token"?: "…", "platform"?: "ios"\|"android" }` | 200 `{status: "ok", recipient_id, tracking_token, label}`, 404 `not_found` (unknown code or round over), 400 `invalid`, 429 `rate_limited` |
| `{ "action": "forget", "tracking_token": "…", "fcm_token": "…" }`           | 200 `{status: "ok"}`: that phone no longer gets the delivery's pushes                                                                      |

The work is done by two SQL functions (migration `20261008130000_delivery_codes_and_devices.sql`), callable by the service role only:

- `redeem_delivery_code(code, client, fcm_token, platform)`: checks the code against rounds whose links haven't expired, counts failed attempts (10 an hour per caller, then `rate_limited`), and links the phone to the recipient (`delivery_devices`, 5 most recent phones kept). The caller key is an HMAC-SHA256 of the IP with the service-role key, never the IP itself; the website's `/l/<code>` page computes the same key.
- `forget_delivery_device(tracking_token, fcm_token)`.

`tracking_token` is the recipient's existing `/track?token=` token: the app reads the delivery's state with `get_tracking_by_recipient_token()`, like the web page.

## Pushes on the delivery day

`start-delivery-round`, `send-delivery-sms`, `check-eta-and-send-arrival-sms` and `send-delivery-complete-sms` also push to the linked phones (`_shared/delivery-push.ts`, texts in `_shared/delivery-messages.ts`): « Notre tournée a commencé : passage prévu entre 9 h 15 et 9 h 45. », « Vous êtes les prochains… », « Nous arrivons dans environ 5 minutes. », « Livrée ! Merci pour votre commande. ». Since #593 part 3 these steps are pushes only; the only SMS are the invitation (`send-delivery-invitations`) and the « 5 minutes » fallback for recipients without a linked phone. Data `{ type: "delivery", id: <recipient_id> }`: a tap opens the delivery in the app.

## Retention

Linked phones are erased by `purge_expired_delivery_personal_data()` (daily, 03:30 UTC) once the round's links expire; failed attempts after 24 hours. A phone FCM no longer knows is dropped at the next push.

## Setup

1. Apply the migration (SQL Editor: staging first, then production).
2. Deploy, without the gateway's JWT check (the app calls it signed out; `supabase/config.toml` says the same):
   `npx supabase functions deploy redeem-delivery-code --no-verify-jwt --project-ref fsklunxplbbtzgurwqmc`
3. Redeploy the four delivery functions so they push:
   `npx supabase functions deploy start-delivery-round send-delivery-sms check-eta-and-send-arrival-sms send-delivery-complete-sms --project-ref fsklunxplbbtzgurwqmc`

Secrets already exist: `FIREBASE_SERVICE_ACCOUNT_JSON` (pushes), `SUPABASE_SERVICE_ROLE_KEY` (provided by Supabase).
