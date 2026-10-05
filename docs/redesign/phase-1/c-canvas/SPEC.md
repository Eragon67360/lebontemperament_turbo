# Direction C — « Canevas »

**Concept.** One calm page at a time: no sidebar, a slim top bar, one centred column, detail and edit in a sheet over the list so nobody loses their place.

**Serves best** the volunteer who opens the admin once a month, on a phone, for one thing. **Trade-off:** less overview for multi-step admin work, more clicks between sections. Mitigation: a prioritised « À faire » list and job shortcuts on the Accueil, section tabs one click away, sheets that keep the list underneath, « Ouvrir en pleine page » for long sessions.

## Layout and navigation

- **Top bar (56 px, sticky):** mark · six section tabs with a teal underline (one row ≥ 1280 px, else two) · account menu. **Mobile:** mark · current-section button opening a bottom sheet « Aller à » · avatar.
- **Page header** (column 960 px, lists 1200 px): eyebrow = section link, large title, one sentence, primary action right; the section's pages as sub-tabs beneath. Views (À venir / Passés) are a segmented control. Campagne 40 ans keeps three tabs (Vue d'ensemble · Contenu · Témoignages); Contenu lists its eight sections as rows.
- **Sheets:** detail and create/edit open in a 600 px right sheet (full screen on mobile): sticky footer, focus trap, Escape (a dirty form asks first). The sheet pushes the item URL; a reload renders the same content as a full page (`fiche-membre.html`).
- **Lists:** rows, not tables: primary + secondary line, status dot + word; compact filter bar (« Filtres » sheet on mobile); selection reveals a bottom action bar.
- **Accueil « Aujourd'hui »:** À faire by importance, À venir, campaign readiness, shortcuts per job.

## Type (Inter)

| Step    | Size/line                     | Weight  | Use                            |
| ------- | ----------------------------- | ------- | ------------------------------ |
| Title   | 28/34 (24/30 mobile), −0.02em | 600     | page title                     |
| Heading | 18/26                         | 600     | section, sheet titles          |
| Body    | 14/20                         | 400/500 | text, inputs (16 px on mobile) |
| Small   | 13/18                         | 400     | secondary lines, hints         |
| Caption | 12/16                         | 500     | chips, counts                  |

## Colour (`tokens.css`; ratios measured)

| Token         | Light   | Dark    | Note                            |
| ------------- | ------- | ------- | ------------------------------- |
| background    | #ffffff | #0c0d0e |                                 |
| surface       | #f6f6f7 | #151618 | hover, bars                     |
| raised        | #ffffff | #1b1c1f | overlays, with shadow           |
| border        | #e6e6e9 | #26272b | strong #cfcfd4 / #3a3b41        |
| text          | #111113 | #f2f2f3 |                                 |
| muted text    | #5c5c66 | #a3a3ad | 6.6:1 / 7.8:1                   |
| accent        | #1a878d | #26a5ad | icons, indicators, large text   |
| accent-strong | #156c71 | #156c71 | buttons, small teal text, 6.2:1 |
| focus         | #1a878d | #26a5ad | 2 px outline                    |
| success       | #166534 | #4ade80 | 6.4:1 / 9.1:1 on soft           |
| warning       | #b45309 | #fbbf24 | 4.6:1 / 7.9:1 on soft           |
| danger        | #b91c1c | #f87171 | buttons #b91c1c / #dc2626       |
| info          | #1d4ed8 | #60a5fa | 5.8:1 / 6.5:1 on soft           |

Semantic colours only for meaning; teal only on the primary action, active tab, selection and provenance chips.

## Spacing, radius, motion

4 px grid; rows 56 px, controls 40 px (44 touch), section gap 40–48 px. Radius 6 / 8 / 12 (chips / controls / containers). Motion 120 ms menus, 160 ms dialogs, 200 ms sheet; none under `prefers-reduced-motion`.

## Components → `components/ui`

Existing primitives cover controls, form + zod, tabs, sheet, dialogs, dropdown-menu, badge, avatar, progress and data-state. To add: `TopBar`, `SectionTabs`, `PageHeader`, `SubTabs`, `ListRow`, `StatusDot`, `Chip` (badge variant), `FilterBar`/`FilterSheet`, `SelectionBar`, `DetailSheet` (sheet variant, sticky footer, unsaved guard), `ErrorSummary` (alert variant), `ConfirmDialog` (alert-dialog, typed confirmation).

## Answers

- **Where am I:** active tab, eyebrow, title, sub-tabs; sheets name their parent page.
- **Primary action:** one filled button per screen; contextual on a detail page (apply the roster difference, resend an invitation).
- **Empty:** icon, what, why, first action (Signalements on Accueil).
- **Errors:** summary callout linking to fields, inline messages, focus on the first invalid field.
- **Destructive:** a separate « Accès au compte » group; deactivation names consequences and reversibility; deletion needs the typed name, superadmin only.
- **Keyboard:** skip link; Tab bar → tabs → action → content; arrows in menus; Space selects rows; Escape clears selection or closes the top layer; Enter submits.

## Hardest to build, and the risk

The URL-synced `DetailSheet` (shallow routing, scroll restoration, full-page fallback), and two tab rows plus a sticky header eating phone height. For occasional users: campaign pages sit two clicks deep, and a sheet hides half the list on laptops. Mocks show the superadmin variant of role-gated items (Signalements, Supprimer définitivement).
