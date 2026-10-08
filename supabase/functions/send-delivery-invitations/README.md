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

Links use the host of the `SITE_URL` secret, which must be `https://www.lebontemperament.com`: the bare domain redirects to www, and iPhones only open the app from the exact host.

## Setup

1. Apply `supabase/migrations/20261008140000_delivery_invitations.sql` (SQL Editor: staging first, then production). It adds `invited_at` and keeps each round's links valid until the day after delivery.
2. Deploy this function and redeploy the four delivery functions (now push-only, apart from the « 5 minutes » fallback):
   `npx supabase functions deploy send-delivery-invitations start-delivery-round send-delivery-sms check-eta-and-send-arrival-sms send-delivery-complete-sms --project-ref fsklunxplbbtzgurwqmc`

Secrets already exist: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SITE_URL`. `DELIVERY_SUPPORT_PHONE` is no longer used (it was in the « livrée » SMS).
