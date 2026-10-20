# send-delivery-invitations

The invitation SMS of a delivery round (#593 part 3). The driver (a superadmin) sends it from the app's driver screen once the round has a date, usually one to two weeks ahead: one SMS per recipient with a phone number, not delivered and not invited yet, then `delivery_recipients.invited_at` is set. Passing `recipientIds` re-sends to those recipients (« Renvoyer l'invitation »).

```
POST { "deliveryId": "...", "recipientIds"?: ["..."] }
→ 200 { sentCount, failedCount, skippedNoPhone }
  400 { error: "no_date" }   the round has no scheduled_at yet
```

The text (`_shared/delivery-sms.ts`, tests in `delivery-sms_test.ts`) fits one SMS: 160 characters of the GSM alphabet. Names are folded to it (ç → c, ’ → ') and left out when the text would not fit.

> Bonjour Marie, votre commande Le Bon Tempérament arrive le sam. 14/11. Suivez-la et soyez prévenu : www.lebontemperament.com/l/K7MP-4XQ9 (code K7MP-4XQ9)

On delivery day the steps are pushes to the phones linked in the app. The only other SMS is the « 5 minutes » one from `check-eta-and-send-arrival-sms`, sent only when no linked phone received the push:

> Bonjour Marie, nous arrivons dans 5 minutes environ avec votre commande ! Suivez-nous : www.lebontemperament.com/l/K7MP-4XQ9 - Félix & Thomas

Phone numbers may be stored as typed (« 06 12 34 56 78 », « +33 6… »): `_shared/sms.ts` turns them into `+33612345678` before sending (`_shared/phone.ts`, the same rule as `public.normalize_order_phone`) and skips a number that can't be one.

## Who sends the SMS

`_shared/sms.ts` picks the provider:

- **An Android phone** (free: the phone's own plan), when the `SMS_GATEWAY_USERNAME`, `SMS_GATEWAY_PASSWORD` and `SMS_GATEWAY_PASSPHRASE` secrets are set. The phone runs the open-source app [SMS Gateway for Android](https://sms-gate.app) in Cloud mode; the function hands each SMS to the app's relay (`api.sms-gate.app`, or `SMS_GATEWAY_URL` for a self-hosted server), which wakes the phone. The text and the number are encrypted with the passphrase before they leave Supabase (`_shared/sms-gateway.ts`), so the relay can't read them; without a passphrase the gateway is not used. « Sent » means the relay accepted it: a phone that is off sends it when it comes back (the « 5 minutes » SMS is dropped after 5 minutes).
- **Twilio** (`TWILIO_*` secrets, about 0.08 $ per SMS to France), when the gateway isn't set up, or when the relay refuses a message. Remove the `TWILIO_*` secrets to never pay for one.

Setting up the phone:

1. Install SMS Gateway for Android on the phone (it isn't on Google Play: download the APK from https://github.com/capcom6/android-sms-gateway/releases/latest/download/app-release.apk and allow the install) whose number should send the SMS, open it, allow SMS, and turn on **Cloud server**. It shows a username and a password.
2. In the app's Settings › Encryption, set a passphrase: a long random one (for example the output of `openssl rand -base64 32`).
3. Supabase › Edge Functions › Secrets: add `SMS_GATEWAY_USERNAME`, `SMS_GATEWAY_PASSWORD` and `SMS_GATEWAY_PASSPHRASE` with those values. No redeploy is needed for a secret change.
4. Android asks for confirmation after about 30 SMS in 30 minutes from one app. Before a round with more recipients, either allow it when the phone asks (and tick the box that remembers the choice), or raise the limit once over USB: `adb shell settings put global sms_outgoing_check_max_count 1000`.
5. Keep the phone charged and online, and let the app run in the background (Android › Battery › the app › Unrestricted).

Links use the host of the `SITE_URL` secret, which must be `https://www.lebontemperament.com`: the bare domain redirects to www, and iPhones only open the app from the exact host.

## Setup

1. Apply `supabase/migrations/20261008140000_delivery_invitations.sql` (SQL Editor: staging first, then production). It adds `invited_at` and keeps each round's links valid until the day after delivery.
2. Deploy this function and redeploy the four delivery functions (now push-only, apart from the « 5 minutes » fallback):
   `npx supabase functions deploy send-delivery-invitations start-delivery-round send-delivery-sms check-eta-and-send-arrival-sms send-delivery-complete-sms --project-ref fsklunxplbbtzgurwqmc`

Secrets already exist: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SITE_URL`. `DELIVERY_SUPPORT_PHONE` is no longer used (it was in the « livrée » SMS).
