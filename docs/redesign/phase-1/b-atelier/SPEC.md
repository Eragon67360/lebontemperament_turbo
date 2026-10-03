# Direction B — « Atelier guidé »

**Concept.** A guided workspace: every screen says where you are, what this is and what to do next, in one sentence each; risky jobs (roster sync, campaign publication) read as three steps, _Vérifier · Choisir · Appliquer_.

**Serves best** the volunteer who opens the admin once a month. **Trade-off:** more words, taller pages; a weekly user pays for the reassurance. Kept from feeling slow by a "Listes : Aérées / Compactes" density switch (rows 56 → 44 px), sticky action bars (the primary never scrolls away), `/` to search, one click from Accueil to each task, and help as collapsed disclosures, never inline manuals.

## Layout and navigation

- **Desktop:** 280 px sidebar, each section with a one-line description ("Membres et accès — Qui fait partie de l'association"), one accordion open at a time; sticky header with "Vous êtes ici : section › page" and the account menu (Messages badge, Signaler un problème, theme, density, Se déconnecter). Content ≤ 1120 px, two columns on home and detail, form + live preview on the concert form.
- **Mobile (390):** menu button, trail (parent › current), avatar; the same sidebar slides in as a drawer; tables become stacked rows; page actions move to a sticky bottom bar holding the single primary.

## Type (Inter)

| Step    | Size/line | Weight  | Use                                   |
| ------- | --------- | ------- | ------------------------------------- |
| Titre   | 28/36     | 600     | h1 (24/32 on mobile)                  |
| Section | 20/28     | 600     | h2 (17/24 inside cards)               |
| Corps   | 16/26     | 400/500 | text, inputs, cells, nav              |
| Détail  | 14/20     | 400/500 | helper text, meta, chips, breadcrumb  |
| Repère  | 13/18     | 500     | sidebar descriptions, counters, dates |

## Colour tokens (`tokens.css`)

| Token         | Light                    | Dark              |
| ------------- | ------------------------ | ----------------- |
| background    | `#f4f6f6`                | `#0f1516`         |
| surface       | `#ffffff`                | `#171f20`         |
| raised        | `#ffffff` + shadow-lg    | `#1f2a2b`         |
| border        | `#dfe5e5`                | `#293535`         |
| text          | `#16201f`                | `#e9eeee`         |
| muted text    | `#5d6b6a` (5.6:1)        | `#a3b2b1` (7.6:1) |
| accent        | `#1a878d`                | `#26a5ad`         |
| accent-strong | `#156c71` (white 6.15:1) | `#156c71`         |
| focus         | `#1a878d`                | `#3fb8bf`         |
| success       | `#1f7a4d`                | `#5fcf8f`         |
| warning       | `#935600`                | `#f2b85c`         |
| danger        | `#b4261b`                | `#ff8278`         |
| info          | `#2457a6`                | `#86b4f5`         |

Each semantic colour has a `-soft` tint for chips and callouts. **Spacing** 4 px grid, gutters 32/16, card padding 24/16. **Radius** 6 · 10 · 14 · 20 (control · input/button · card · dialog). **Density** comfortable 56 px rows / 44 px controls; compact 44/40.

## Components → `components/ui`

Existing: `sidebar` (adopt, add the description line), `breadcrumb`, `card`, `button`, `badge`, `checkbox`, `select`, `input`, `textarea`, `form`, `alert`, `alert-dialog`, `dialog`, `dropdown-menu`, `sheet`, `table`, `progress`, `collapsible`, `tooltip`, `data-state`. To add: `PageHeader`, `Stepper`, `TaskRow`, `StickyActionBar`, `ErrorSummary`, `DiffCard`, `ProvenanceNote`, `Timeline`; a density preference beside the theme.

**Motion:** 160 ms ease on hover, menus and the drawer only; none under `prefers-reduced-motion`.

## How it answers

- **Where am I:** sidebar highlight + description, "Vous êtes ici" trail, h1 and intro sentence.
- **Primary action:** one filled teal button per screen (Accueil: the first task; Membres: Synchroniser; form: Créer le concert; fiche: Appliquer la valeur de la liste); all else outlined or text.
- **Empty:** what, why, first action (Accueil › Association).
- **Errors:** top summary (`role=alert`, links to fields) plus inline message and hint per field; required `*`, "(facultatif)"; the live preview shows the consequence ("Lieu manquant").
- **Destructive:** red outlined buttons inside a bordered "Actions sensibles" card; the dialog names the person, lists the effects and says it's reversible. Permanent deletion is disabled for admins with the reason written out; the superadmin version asks to type the name.

**Keyboard:** 2 px teal `:focus-visible` ring; Tab order = reading order; Escape closes menu, drawer and native `<dialog>`s; Enter submits; `/` focuses search.

## Hardest to build, and the risk

Hardest: the review-then-apply flow behind the stepper (needs the F2 sync rebuild), the live concert preview sharing the website's card, and per-field roster provenance. Risk for occasional users: intro sentences and descriptions must stay true as features change or the guidance turns to noise; owning that copy in `lib/navigation.ts` is the mitigation. Signalements (superadmin) is omitted because Camille is an admin.
