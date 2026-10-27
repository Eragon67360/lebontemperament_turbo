# Le Bon Tempérament: domain vocabulary

The words the association, its members and the code use. Use them in issues, code names and UI copy; extend this file when a new term settles. French terms are the product's; the code's English or table names are in brackets.

## The association

- **Le Bon Tempérament**: a choir and orchestra association. Its public face is the website; its members use the members area and the mobile app; its board and admins use the admin dashboard.
- **Groupe** (`group_type`): which ensemble something concerns: Orchestre, Chœur complet (`Choeur complet` in the data), Tous, Hommes, Femmes, Jeunes/Enfants. Rehearsals, events and work materials are scoped by group.
- **Membre** (`profiles`): a person with an account. Has a role, groups, a voice (`voice`), a profile picture, and shows in the member directory.
- **Nom** (`display_name`): one field, always written « Prénom NOM » (surname in capitals, last), e.g. « Lucie BERNARD ». The roster's « NOM Prénom » column, the admin's forms and invitations all store it in that order (`normalizeName` in `@repo/domain`).
- **Rôle** (`user_role`): `user` (member), `admin`, `superadmin`.
- **CA** (`cas`): a board meeting (_conseil d'administration_) record: title, date, attached file (minutes).
- **AG**: the general assembly (_assemblée générale_); `/ag` shows the newest one, edited in the admin (Association › Assemblée générale); `/ag-2026` redirects there.

## Music and calendar

- **Concert** (`concerts`): a public performance, listed on `/concerts` and in the admin's "prochains concerts".
- **Programme** (`programs`): a concert programme (check the table before relying on the exact shape).
- **Projet** (`projects`): a project shown on the website and managed in the admin.
- **Tournée** (`tours`): a tour.
- **Événement** (`events`): a calendar entry for members; creating one can send a push notification.
- **Répétition** (`rehearsals`): a rehearsal, synced from the association's Google Calendar by the `sync-rehearsals-from-calendar` function (`rehearsal_sync_logs` records each run).
- **Travail** (`/membres/travail`): work materials (scores, recordings) per group, in Google Drive (`drive_folders`, and the `drive_index_nodes` index kept by `sync-drive-index`). `files` and `folders` belong to the old Supabase Storage explorer, kept until it is retired.

## Public site

- **Découvrir**, **Galerie**, **Rejoindre**, **FAQ**, **Contact**: the public pages of the same names.
- **Don**: a donation, made on HelloAsso since 2026-08-31 (`/don` links to the campaign; HelloAsso issues the receipt). `donations`, `donors` and `donation_receipt_seq` hold the records of the earlier donations paid through Stripe, with their numbered receipts.
- **40 ans** (`anniversary_*`): the 40th-anniversary experience and its CMS (hero, stats, timeline, memories, audio memories, photos, videos, archives, navigation cards, the memory submission form).
- **Souvenir** (memory): a member's or visitor's submitted memory for the anniversary.
- **Documents de l'association** (`site_documents`, `document_collections`, `content_revisions`): the PDFs of the members area, by collection, managed in the admin (Association); a document's address is `/documents/<collection>/<file>`.
- **Annonces** (`site_announcements`): the buttons under the home page's title and the donation campaign card, each shown between its start and end days.
- **Réglages du site** (`site_settings`): the contact details, social links, HelloAsso link and tiers, joining facts and legal notice the website reads, one row per key.
- **Rejoindre et FAQ** (`joining_slots`, `faq_items`): the rehearsal times of `/rejoindre` and the questions of `/faq`, in the admin's order.

## Operations

- **Activité** (`activities`, `activity_type`): the admin activity feed (user created, role changed, concert created/updated/deleted, poster updated, group updated, CA created, tour created).
- **Notification** (`notifications`): a message to members, delivered as a push notification (FCM) to the app.
- **Tournée de livraison** (`deliveries`, `delivery_recipients`): a delivery round: a driver, recipients, an optimized route, a public tracking link (`public_token`, expiring), SMS to recipients (the association's Android phone, Twilio as fallback). A driver's **tournée en cours** is their latest round unless every stop of it is delivered: the app's « Mode livraison » opens it and names it, and « Ajouter à la tournée » fills it (`add_sale_orders_to_delivery`). « Nouvelle tournée » starts an empty one and leaves the old one in the history.
- **Vente** et **Commande** (`order_sales`, `order_products`, `orders`, `order_items`, `order_payments`): a sale (e.g. the November cheese sale) with its own catalogue and prices; an order is one buyer (« acheteur »: name, phone, address, « vendu par », livraison or retrait) with quantities and payments (virement, espèces, chèque). Superadmins only, in the admin and the app. « Ajouter à la tournée » copies the buyers to deliver into a delivery round. Buyers’ details are erased 30 days after delivery day.
- **Signalement** (`bug_reports`, `bug_messages`): a problem reported from the admin's « Signaler un problème » or the app, with its message thread; the admin's « Signalements » page (superadmins) answers them, and `notify-bug-report` pushes each new report and answer to the phones concerned.
- **Feature flag** (`feature_flags`): switches read by the website (`lib/featureFlags.ts`, on the server: `anniversary_40_years`), the admin (`/api/feature-flags`) and the app (its own rows `mobile_maintenance` and `mobile_min_version`, #361).
- **Alerte** (`ops_alerts`, `push_devices`): a production alert raised by `check-ops-alerts` (a failed or stale sync, a failed cron job or edge-function call) and pushed to the superadmins' phones.
- **Liste de diffusion** (`mailing_list_comparisons`, `mailing_list_exceptions`): the Google Groups lists read through the Apps Script, compared with the member roster in the admin (Membres et accès › Liste de diffusion).
