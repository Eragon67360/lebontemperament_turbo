# Le Bon Tempérament: domain vocabulary

The words the association, its members and the code use. Use them in issues, code names and UI copy; extend this file when a new term settles. French terms are the product's; the code's English or table names are in brackets.

## The association

- **Le Bon Tempérament**: a choir and orchestra association. Its public face is the website; its members use the members area and the mobile app; its board and admins use the admin dashboard.
- **Groupe** (`group_type`): which ensemble something concerns: Orchestre, Chœur complet (`Choeur complet` in the data), Tous, Hommes, Femmes, Jeunes/Enfants. Rehearsals, events and work materials are scoped by group.
- **Membre** (`profiles`): a person with an account. Has a role, groups, a voice (`voice`), a profile picture, and shows in the member directory.
- **Rôle** (`user_role`): `user` (member), `admin`, `superadmin`.
- **CA** (`cas`): a board meeting (_conseil d'administration_) record: title, date, attached file (minutes).
- **AG**: the general assembly (_assemblée générale_); `/ag-2026` is its page.

## Music and calendar

- **Concert** (`concerts`): a public performance, listed on `/concerts` and in the admin's "prochains concerts".
- **Programme** (`programs`): a concert programme (check the table before relying on the exact shape).
- **Projet** (`projects`): a project shown on the website and managed in the admin.
- **Tournée** (`tours`): a tour.
- **Événement** (`events`): a calendar entry for members; creating one can send a push notification.
- **Répétition** (`rehearsals`): a rehearsal, synced from the association's Google Calendar by the `sync-rehearsals-from-calendar` function (`rehearsal_sync_logs` records each run).
- **Travail** (`/membres/travail`): work materials (scores, recordings) per group, in Google Drive (`drive_folders`, `files`, `folders`).

## Public site

- **Découvrir**, **Galerie**, **Rejoindre**, **FAQ**, **Contact**: the public pages of the same names.
- **Don** (`donations`, `donors`, `donation_receipt_seq`): a donation through Stripe, with a numbered receipt.
- **40 ans** (`anniversary_*`): the 40th-anniversary experience and its CMS (hero, stats, timeline, memories, audio memories, photos, videos, archives, navigation cards, the memory submission form).
- **Souvenir** (memory): a member's or visitor's submitted memory for the anniversary.

## Operations

- **Activité** (`activities`, `activity_type`): the admin activity feed (user created, role changed, concert created/updated/deleted, poster updated, group updated, CA created, tour created).
- **Notification** (`notifications`): a message to members, delivered as a push notification (FCM) to the app.
- **Tournée de livraison** (`deliveries`, `delivery_recipients`): a delivery round: a driver, recipients, an optimized route, a public tracking link (`public_token`, expiring), SMS to recipients (Twilio).
- **Bug report** (`bug_reports`, `bug_messages`): a reported problem with its message thread, handled in the admin.
- **Feature flag** (`feature_flags`): switches read by the website and admin (`/api/feature-flags`).
