# Design guardrails

Three surfaces, one brand teal `#1A878D`: the public website (HeroUI 3), the admin dashboard (shadcn/Radix, being redesigned) and the mobile app (Flutter `AppTheme`). The website and the app **get better, never replaced**: more consistent, more accessible, more polished. The admin is **being redesigned** to direction B « Atelier guidé » (owner's choice, #433 and #454): Phase 2 (#455) laid the design-system foundation described below, Phase 3 (#457) rebuilt the shell and the navigation, Phase 4 migrates the screens in waves, Phase 5 hardens (a11y, dark mode). Until a screen is migrated it keeps its current markup on top of the new primitives.

## Admin: direction B « Atelier guidé »

Source of truth: `docs/redesign/phase-1/b-atelier/` (`SPEC.md`, `tokens.css`, the four mockups) and the code in `apps/admin/app/globals.css` and `apps/admin/components/ui`. The review page `/dashboard/design-system` (admin login required; `notFound()` in production) shows every primitive and building block in every state with a theme and a density switch: open it before touching a primitive, and add any new primitive or state to it.

### Tokens (`app/globals.css`, Tailwind v4 `@theme inline`)

- **Surfaces**: `bg-background` (page `#f4f6f6`), `bg-card` (white cards, inputs, tables), `bg-popover` (menus, dialogs, with `shadow-lg`), `bg-surface-sunken` / `bg-muted` (table header, muted blocks), `bg-overlay` (dialog backdrop). Text: `text-foreground` (16.3:1), `text-muted-foreground` (`#5d6b6a`, 5.6:1 on white), `text-foreground-faint` (icons and decoration only, never text). Borders: `border-border` (`#dfe5e5`), `border-input` / `border-border-strong` (`#c2cccc`, inputs and outlined buttons).
- **One accent**: `primary` (`#1A878D`: large text, icons, borders, progress), `primary-strong` (`#156c71`: every filled teal surface carrying white text, 6.15:1), `primary-text` (`#156c71`: small teal text), `primary-soft` / `primary-soft-border` (selected rows, active nav, active tab). `primary-600` is an alias of `primary-strong` kept for old call sites. The section hues (blue admin, purple members, green public) are gone: `PageShell`'s `theme` and `Card`'s `variant` props are accepted and ignored (`@deprecated`).
- **Semantic, for meaning only**: `success`, `warning`, `danger`, `info`, each with `-soft` (background tint) and `-foreground` (readable text on the tint). `destructive` (`#b4261b`) is the filled destructive button only. Never a raw `bg-green-100`, `text-amber-700` or hex colour in a component; the one exception is a page not yet migrated.
- **Dark**: every token has a `.dark` value (next-themes, `attribute="class"`). The app is **forced to light** in `app/providers.tsx` until the Phase 5 sweep, because pages still hard-code light surfaces; only `/dashboard/design-system` can switch. Primitives must already be dark-correct: tokens only, no `bg-white`, `text-gray-*`, `border-gray-*` or hex in `components/ui` and `components/layouts` (grep before pushing).
- **Radius**: `rounded-sm` 6 (controls, menu items), `rounded-md` 10 (inputs, buttons), `rounded-lg` 14 (cards), `rounded-xl` 20 (dialogs); `2xl`/`3xl` are capped at 20.
- **Elevation**: `shadow-sm` (cards), `shadow-md`, `shadow-lg` (menus, dialogs), tokenised and dark-aware.
- **Type**: Inter, five steps as utilities: `text-title` 28/36 600 (h1; `text-2xl` under `lg`), `text-section` 20/28 600 (h2; `text-[17px]/6` inside cards), `text-body` 16/26, `text-detail` 14/20 (helper text, chips, meta), `text-note` 13/18 (sidebar descriptions, counters, provenance). Buttons, labels and nav use 15 px like the mockups. The default Tailwind sizes still exist; new code uses the five steps.
- **Density**: `--row-h` 56 and `--control-h` 44 (comfortable), 44 and 40 under `<html data-density="compact">`. `components/DensityProvider.tsx` reads and writes the choice (`lbt-admin-density` in localStorage, try/catch) and exposes `useDensity()`; Phase 3 adds the « Listes : Aérées / Compactes » switch to the account menu. Use `h-(--control-h)` / `h-(--row-h)` for anything that should follow it.
- **Motion**: 160 ms `--ease` on hover, menus and the drawer only; `--motion` is 0 under `prefers-reduced-motion`. Radix overlays keep their `tw-animate-css` enter/exit with `motion-reduce:animate-none`.
- **Focus**: one global `:focus-visible` rule, 2 px teal outline, 2 px offset. Primitives do not set `outline-none`; inputs pull the offset to 0 and tint the border. Never a `focus:` ring (it shows on mouse click).

### Primitives (`components/ui`, all exported APIs unchanged)

- **Button**: `default` is the one filled teal button of a screen; `outline` and `ghost` for everything else; `link` for text links; `destructive-outline` on the page (inside a bordered « Actions sensibles » card); `destructive` (filled) only as a dialog's confirm (`AlertDialogAction variant="destructive"`). Sizes: `default` 44 px (`--control-h`), `sm` 40 (44 on coarse pointers), `lg` 48, `icon` 44, `icon-sm` 40. Pages may still override the height with a class.
- **Input, Textarea, SelectTrigger** share one geometry: control height, radius 10, `border-input`, `bg-card`, `aria-invalid` turns the border red with a soft ring. **Checkbox** 20 px (wrap it in a 44 px label or cell), supports `checked="indeterminate"`. **Switch** 24×44. **Label** 15 px 500, with `RequiredMark` (« * », announced « (obligatoire) ») and `OptionalMark` (« (facultatif) »).
- **Badge**: pill, 28 px, `text-note`; `default` filled counter, `secondary` neutral chip, `outline`, `accent`, and the soft `success` / `warning` / `danger` / `info`; `dot` adds a status dot. **StatusBadge** = word + dot by `tone`.
- **Card** radius 14, border, `shadow-sm`, no gradient, no hover lift. **Dialog / AlertDialog / Sheet**: `bg-popover`, radius 20 (dialogs), 40 px close button labelled « Fermer », footer = Cancel then primary (`flex-col-reverse` on phones, so the primary sits on top). **DropdownMenu / Select** items are 44 px (`--control-h`). **Tabs** are a segmented control, active in `primary-soft`. **Table**: sunken header, rows at `--row-h`, `data-state="selected"` tints the row and marks its left edge. **Alert**: `default`, `info`, `success`, `warning`, `danger` (`destructive` = `danger`). **Skeleton** `bg-border/70`, **Progress**, **Avatar** (soft teal fallback), **Tooltip** (inverted neutral), **Breadcrumb** (`text-detail`, underline on hover).
- Removed (unused): `hover-card`, `navigation-menu`, and since Phase 3 the shadcn `sidebar` (the shell has its own, see below). `breadcrumb` stays for in-page trails (the file explorer), `collapsible` and `sheet` are the shell's.

### Building blocks

- `components/layouts/PageHeader.tsx`: « Vous êtes ici » trail (`trail`), title, one-sentence `intro`, `actions` (one primary), optional `help` disclosure (« Comment ça marche ? »). `PageShell` renders through it with its old props. The shell header already shows the trail for every route, so pages leave `trail` empty unless they need a deeper, page-specific one; `PageTrail` is the shared renderer.
- `components/ui`: `ErrorSummary` (`role="alert"`, focused when shown, one link per field), `StickyActionBar` (bottom of a form, safe-area aware, `secondary` left, primary right, `note`), `Stepper` (Vérifier · Choisir · Appliquer, states todo/current/done, `aria-current="step"`), `StatusBadge`, `Callout` (title + body + `actions`, tones info/success/warning/danger), `ProvenanceNote` (« Mis à jour depuis la liste des membres… »). `FormDialog` (Phase 4, #464: a dialog around a form with « Annuler » and the one primary; closing it dirty — Escape, outside click, close button, « Annuler » — asks « Abandonner les modifications ? » through `UnsavedChangesDialog`; a successful save closes it through `onOpenChange(false)` without the question).
- `components/ui/data-state.tsx` (API unchanged, 74 usages): `DataState`, `ListSkeleton`, `CardGridSkeleton`, `PageSkeleton`, `EmptyState` (icon, what, why, first action), `ErrorState` (what failed, what to do, « Réessayer »). Never hand-roll loading, empty or error UI.

### Shell and navigation (Phase 3, #457)

`components/DashboardShell.tsx` is the frame of every `/dashboard` route: a 280 px sidebar from `lg` (`components/shell/AppSidebar.tsx`, a drawer below `lg` via `Sheet`, opened by the header's 44 px menu button, closed when the route changes), a 64 px header (`components/shell/AppHeader.tsx`: « Vous êtes ici », then the account menu), and `<main id="main">`, the one scroll container, capped at 1120 px with 16/32 px gutters. Pages keep their own vertical padding. The app stays forced to light until Phase 5; the account menu has no theme switch yet.

- **The tree lives in `lib/navigation.ts`** (`buildNavSections`): six sections in the IA's order (`docs/redesign/00-inventory.md` § d.1), each with a `label`, a one-line `description` (shown under the label and as the section's `title`), an `icon`, and either an `href` (Accueil is a page) or `groups` of items; a group may carry a heading (« Contenu », « Témoignages »). Labels are the IA's plain French; the mapping from the old labels is § d.2. `lib/navigation.test.ts` asserts that every one of the 22 pre-redesign routes keeps an entry: **to add a page**, give it an item in the right section (or a group), add its href to that test's list, and let the trail follow; role-gated entries (`Signalements`, superadmin) are pushed in `buildNavSections` from the context, never hard-coded in a component. Only routes that exist belong in the tree; one-off screens (preview, migrate, a programme's groups) are reached from their parent page and stay out of it.
- **Sidebar behaviour** (`components/shell/SidebarNav.tsx`): one section open at a time (Radix `Collapsible`, `aria-expanded`), the section owning the current route opens itself; the current entry is `aria-current="page"` with the soft teal background and the 3 px teal left edge; `activeNavHref` picks the longest matching ancestor so nested routes light up their parent. Rows are ≥ 44 px; sub-entries are 40 px with a mouse and 44 px on touch (`pointer-coarse`). The footer link « Voir le site public » opens `NEXT_PUBLIC_WEBSITE_URL` in a new tab.
- **The trail** (`lib/trail.ts`, `buildTrail`, rendered by `PageTrail` in the header) is worded like the sidebar: a nav page reads _section › group › page_ (section and group are plain words: no page behind them); a deeper route keeps its nav ancestors as links and ends with its dynamic tail (the programme name from `useProgramName`, the group slug, a story slug); routing-only segments (`/admin`, `/preview`) are skipped. Phones show the parent and the page only. `lib/trail.test.ts` pins these rules.
- **Account menu** (`components/shell/AccountMenu.tsx`): avatar with the unread Messages count, name (from `lg`), then name · role · e-mail, **Messages** (count), **Signaler un problème**, **Densité des listes** (Aérées / Compactes, `useDensity`), **Se déconnecter**. Messages is no longer a nav entry. The two dialogs are mounted once by `DashboardShell`, outside the header and the drawer, and opened after a `setTimeout(…, 0)` so the menu has closed first; keep that order when adding a dialog trigger to the shell. The badge queries (`useMyBugReports`, `useUnreadBugReports`) are read in `DashboardShell`, so the polling runs whatever is open.
- **Mobile**: menu button, trail, avatar in the header; the drawer is the same `AppSidebar` in a 280 px `Sheet` (`bg-sidebar`, close button in the brand row). Nothing in the shell may introduce horizontal scroll at 390 px.

### Campaign screens (Phase 4 wave 1, #464)

The 11 « Campagne 40 ans » screens are the reference for a migrated list and its dialog: `components/anniversary/ContentRow` (visual, title, `StatusBadge` Visible/Masqué, facts, then the same row actions everywhere: « Modifier », « Masquer / Afficher », « Supprimer » as `destructive-outline`, plus the drag handle and « Monter / Descendre »), `CampaignList` (dnd-kit list over `hooks/useAnniversaryReorder`, which plans the move with `utils/anniversary/reorder.ts` and writes `{ id, display_order }` through the list's existing `PATCH`), `form-fields.tsx` (typed `TextField`, `YearField`, `TextareaField`, `SelectField`, `SwitchField`, `IconField`, `AssetField` on react-hook-form + the zod schemas of `utils/formSchemas.ts`), `FormFeedback` (`ErrorSummary` after a submit plus a danger `Callout` when the server refuses), `AssetUploader` (one uploader for images, audio and documents, hints derived from `utils/uploads.ts`). The icon picker shows human names (`utils/anniversary/icons.ts`); navigation targets are chosen from `utils/anniversary/sections.ts` by name. « Vue d’ensemble et publication » reads `GET /api/anniversary/readiness` (pure `utils/anniversary/readiness.ts`) and publishes through `PublicationDialog`, whose confirm stays disabled until « J’ai vérifié le contenu » is ticked.

### The home (Phase 4 wave 2, #473)

`/dashboard` is the hub of the IA: « Bonjour {prénom} », the date, one sentence, then **« À faire »** (`components/home/TodoSection.tsx`, rows from the pure `utils/home/tasks.ts`: a Drive sync that failed or left folders unreadable, memories to moderate, unread messages, campaign sections to complete; only the first row's button is the filled teal one; « Lire » opens the shell's Messages dialog through `components/shell/ShellDialogs.tsx`), **« À venir »** (`utils/home/upcoming.ts` merges rehearsals, events and concerts, 30 days, 6 rows, each a link), the **campaign card** (Publiée / Masquée, N sections prêtes sur 10), **« Que voulez-vous faire ? »** (one `JobCard` per nav section with its description from `lib/navigation.ts`, one or two links and status lines from `utils/home/jobs.ts`) and **« Activité récente »** last. Each section owns its queries and its `DataState`; a section fed by several queries keeps what loaded and names what failed (`SourceNote`). The home reuses the shell's badge queries and never calls `/api/users/sync`, Drive or any external service. Unit tests: `utils/home/*.test.ts`; static renders in `components/home/home.test.ts` (the test runner `scripts/run-tests.mjs` finds every `*.test.ts(x)`).

### Rules for every admin screen

1. **Where am I, what is this, what next**: trail, h1, one intro sentence; sidebar descriptions and intros are owned in `lib/navigation.ts` and must stay true as features change.
2. **One primary action per screen**, filled teal, in the header or the sticky bar; everything else outlined or text. On phones the primary moves to the sticky bottom bar.
3. **Destructive actions** are `destructive-outline` inside a bordered « Actions sensibles » card and always confirmed by an `AlertDialog` that names the person or item, lists the effects and says whether it is reversible; the confirm is the filled red `AlertDialogAction variant="destructive"`. Permanent deletion is disabled for admins with the reason written out.
4. **Forms**: `*` for required, « (facultatif) » for optional, a hint under the field, inline error (`FormMessage`) plus the `ErrorSummary` on submit, focus on the first invalid field.
5. **States**: skeleton that matches the layout, `EmptyState` that teaches, `ErrorState` with retry, pending buttons (`aria-busy`, spinner).
6. **Copy**: plain French, warm, no jargon, enum values or column names; one sentence where a paragraph would do; help lives in collapsed disclosures, never inline manuals. UI copy changes are content decisions: propose them.
7. **Keyboard and touch**: Tab order = reading order, visible focus, Escape closes overlays, Enter submits, 44 px targets on touch, usable at 390 px without horizontal scroll.
8. **Contrast**: AA with numbers. Small teal text is `text-primary-text`; white on teal is `bg-primary-strong`; never opacity on text; `text-foreground-faint` is for icons only.

## Website (`apps/website`)

HeroUI 3 with tokens in `app/globals.css`. Light: white background, `#11181c` text; dark (`.dark`): teal-tinted `#0d1616`. Contrast aliases since #337: `bg-primary-solid` / `hover:bg-primary-solid-hover` (`#156c71` / `#105155`) for every solid teal surface carrying white text, `text-primary-text` for small teal text, faded titles `text-primary-400 dark:text-primary` (large text only). Roboto. Global `:focus-visible` 2 px primary outline; `prefers-contrast: high` switches to black. Motion with `motion` and GSAP, guarded by `hooks/useReducedMotion.ts`; the anniversary intro is skipped for returning visitors and under reduced motion. Shared pieces: `LayoutShell`, `Navigation`, `Footer`, `Hero`, `MotionSection`, `LinkButton`, `CloudinaryImage`, `SkeletonImage`, `Breadcrumb`, `JsonLd`. The website's look does not change: after the HeroUI v3 migration, several commits restored exact parity with v2 (button geometry, nav spacing, the exact teal).

## Mobile (`apps/mobile_app`)

`lib/core/theme/app_theme.dart` (colours, light and dark) and `theme_provider.dart` (user choice). Light background `#F5F5F5`, surfaces white, text `#212121` / `#757575`; dark background `#181C1F`, surface `#23272A`. `AppTheme.primaryColor = Color(0xFF1A878D)`.

## Invariants: never change without the owner's explicit approval

- The brand teal and its scales; the website's and the app's light and dark palettes; the admin's B token values.
- Fonts: Roboto (website), Inter (admin), the app theme's typography.
- The component libraries: HeroUI on the website, shadcn/Radix in the admin (`components/ui`, extended, never a parallel system), the app's `AppTheme`. No new UI library, no new runtime dependency without asking.
- The website's navigation, hero and sections, the members area structure, the app's navigation. The admin's IA follows `docs/redesign/00-inventory.md` section d and the approved phases.
- Motion vocabulary: no new animation styles; the anniversary experience stays as designed.
- Voice: French, warm, associative.

A change to any of these is a **breaking change**: show before/after and wait for a decision.

## Improvements you can make without asking

- Accessibility within the palette: contrast with the darker or lighter steps, visible focus, target sizes (WCAG 2.2 §2.5.8, at least 24×24 px; 44 px on the admin's touch targets), reduced-motion guards, accessible names, heading order, form errors announced.
- Consistency: the existing primitives and tokens instead of one-off styles; replace raw hex, greys and arbitrary values with tokens.
- States: skeletons that match the real layout, empty and error states, pending buttons.
- Dark mode: fix surfaces that hard-code light colours (admin: tokens only; the forced-light switch stays until Phase 5).
- Responsive polish: no horizontal scroll at 390 px, readable line lengths, correct image `sizes`.
- Performance that doesn't change the look: image sizing and priority, fewer client components, no layout shift.

A new token or shared component is allowed when it names something already repeated by hand in several places; add it where its surface keeps tokens, migrate the call sites in the same PR, show it on the design-system page (admin) and note it here.

## Verifying a visual change

1. Screenshot the affected pages **before** touching code: 390×844 and 1280×800, light and dark (website; admin on the design-system page), a small and a large phone (app).
2. Take the same shots after and compare. At rest, anything that changed must be intended; list it in the PR.
3. Check keyboard (Tab order, visible focus, Escape closes overlays, Enter submits) and reduced motion for anything interactive or animated.
4. Check contrast with numbers (WCAG ratio) for any text or state you touched.
5. Attach the screenshots to the PR; send the owner the before/after pair for pages he cares about (home, concerts, members area, donation, the anniversary pages; admin: the screens of the current migration wave).

## Anti-patterns to refuse, even if asked casually

- A component library's default look where the project has its own (HeroUI v3 defaults are "grayish/bluish"; the site keeps v2's pure white and teal; the admin keeps B, not stock shadcn).
- A second accent colour, a per-section hue, a decorative gradient, a coloured card border.
- Hand-rolled loading, empty or error UI in the admin; a second primary button on a screen; a destructive action without its confirmation dialog.
- New animation libraries or scroll listeners next to existing ones.
- Changing the teal "a little" to fix contrast: use the existing darker or lighter steps instead.
