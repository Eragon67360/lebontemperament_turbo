# Direction A — « Console »

**Concept.** An operator console: a quiet, dense shell where everything is one keystroke or one click away.

**Serves best / trade-off.** The regulars who open the admin weekly: dense tables, a side panel instead of page hops, a ⌘K palette, shortcuts. The cost: density and hints can intimidate the once-a-month volunteer. Mitigations: every icon is labelled (sidebar expanded by default), every shortcut is also a visible button, the palette is optional and says so, each page has a one-sentence lede, empty states teach.

## Layout and navigation

- **Desktop:** 232 px sidebar (collapsible to a 52 px icon rail, `[`), IA groups as uppercase labels, counts on Accueil/Membres/Témoignages. Top bar: breadcrumb + account menu (Messages badge, Signaler un problème, theme, Se déconnecter). Page header: title, lede, actions.
- **Split view (Membres):** row click / ↵ opens a 384 px panel: summary, key facts, roster difference, the two safe actions. "Ouvrir la fiche" / `O` goes to the full page (history, role, deactivation, deletion). Below 1440 px the sidebar collapses to the rail while the panel is open.
- **Mobile (390):** drawer sidebar, tables collapse to name + voice + status, panel becomes a full-screen sheet, bulk bar docks at the bottom, 44 px targets.
- **⌘K palette** (`accueil.html#palette`): actions, go-to (G then letter), recent.

## Type scale (Inter)

| Step | Size/line | Weight   | Use                        |
| ---- | --------- | -------- | -------------------------- |
| 2xs  | 11/16     | 500 caps | group labels, kbd          |
| xs   | 12/16     | 400–500  | meta, badges, hints        |
| sm   | 13/20     | 400      | data, body, nav            |
| md   | 14/20     | 500      | labels, card/dialog titles |
| lg   | 18/24     | 600      | page title, counts         |

## Colour tokens (`tokens.css`)

| Token                  | Light              | Dark              |
| ---------------------- | ------------------ | ----------------- |
| background             | #fafafa            | #0e0f11           |
| surface / raised       | #ffffff / + shadow | #151618 / #1b1c1f |
| border                 | #e4e4e7            | #26282c           |
| text / muted           | #18181b / #52525b  | #ededef / #a1a1aa |
| accent / accent-strong | #1a878d / #156c71  | #26a5ad / #156c71 |
| focus                  | #1a878d            | #26a5ad           |
| success / warning      | #15803d / #a16207  | #4ade80 / #fbbf24 |
| danger / info          | #b91c1c / #1d4ed8  | #f87171 / #60a5fa |

Badges use soft tints; selection is a 10 % accent tint. Every text pair measured ≥ 4.5:1.

**Spacing, radius, density.** 4 px grid; rows 36 px desktop, 44 px touch; controls 28 px; radius 4/6/8/12.

## Components → `components/ui`

Existing: button, badge, checkbox, input, select, textarea, form, dialog/alert-dialog, dropdown-menu, sheet (drawer, mobile panel), table, tooltip, sidebar (becomes the shell), data-state. To add: command (cmdk ships with shadcn, no new library), kbd, filter-chip, bulk-bar, split-panel, inbox-row, key-value list, timeline.

**Motion.** 120–200 ms ease-out on palette, dialog, sidebar width; none under `prefers-reduced-motion`.

## How it answers the mandate

- **Where am I:** sidebar highlight + breadcrumb + title + lede.
- **Primary action:** one filled teal button per page (Vérifier on the top inbox item, Synchroniser…, Créer le concert); the fiche keeps its actions deliberate.
- **Empty:** "Vos signalements": what, why, first action.
- **Errors:** summary alert with links, inline messages, `aria-invalid`, focus on the first invalid field.
- **Destructive:** outlined danger button → alert dialog naming Lucie, the consequences and the reversibility, focus on Annuler. Permanent deletion: red zone, superadmin only, types the name.

**Keyboard.** ⌘K palette · `/` search · `[` sidebar · `C` create · `J`/`K` move · `X` select · ↵ panel · `O` fiche · Esc closes overlay, panel, then selection · ⌘↵ submits.

**Hardest to build.** Split view with URL state, focus management between table, panel and bulk bar, Realtime badges in the new shell. **Risk for occasional users:** the rail and 13 px tables; if testing shows it, use 40 px rows and never auto-collapse.
