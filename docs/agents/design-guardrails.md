# Design guardrails

**The design system does not change; it gets better.** Le Bon Tempérament's look is one brand teal across three surfaces: the public website, the admin dashboard and the mobile app. Your job is to make them more consistent, more accessible and more polished, never to replace them. Recent history shows how much this matters: after the HeroUI v3 migration, several commits restored exact visual parity with the v2 site (button geometry, nav spacing, the exact brand teal).

No standalone design-system document exists yet; this page records the system as it is (2026-10-01). Writing a fuller `docs/design-system.md` from the code is a welcome improvement, provided it describes, not redesigns.

## The system as it is

### Brand

- **Brand teal `#1A878D`** everywhere: website `--primary-500` (and `--primary`/`--accent` as `lab(50.99% -28.31 -12.12)`), admin `--primary` / `--ring` / `--sidebar-primary` as `oklch(0.57 0.0911 200.74)`, mobile `AppTheme.primaryColor = Color(0xFF1A878D)`.
- Teal scales: website `--primary-50` … `--primary-900` (light) and a lighter dark-mode scale (`--primary-500: #26a5ad` in `.dark`); mobile `primaryColorLight #2A9A9F`, `primaryColorDark #147A7F`.

### Website (`apps/website`)

- **HeroUI 3** components with tokens in `app/globals.css` (sections: imports, `@theme` variables, base layer, components, utilities). Light: white background, `#11181c` text, neutral `--default` surface `#d4d4d8`. Dark (`.dark`): teal-tinted `#0d1616` background, `#ecedee` text, surfaces `#1a2c2c` / `#203535`.
- **Roboto** (`next/font/google` in `app/layout.tsx`).
- Global focus: `:focus-visible` 2px outline in the primary color; `prefers-contrast: high` switches primary and borders to black.
- Motion: `motion` and GSAP for sections and the anniversary experience (`/40-ans`), guarded by `hooks/useReducedMotion.ts`. The anniversary intro is skipped for returning visitors and under reduced motion.
- Shared pieces: `LayoutShell`, `Navigation`, `Footer`, `Hero`, `MotionSection`, `LinkButton`, `CloudinaryImage`, `SkeletonImage`, `Breadcrumb`, `JsonLd`.

### Admin (`apps/admin`)

- **shadcn/ui on Radix** (`components/ui/*`, generated, excluded from Prettier), tokens in `app/globals.css` (oklch, `--radius: 1rem` with `sm`/`md`/`lg`/`xl` derived), light and dark, sidebar tokens.
- **Inter**.
- Shared states and layout: `components/ui/data-state.tsx` (`DataState`, `ListSkeleton`, `CardGridSkeleton`, `PageSkeleton`, `EmptyState`, `ErrorState`), `components/layouts/PageShell.tsx`, `DashboardPageHeader`, `BreadcrumbNav`, `Sidebar` / `MobileSidebar`. New admin pages use these; don't hand-roll loading or error UI.

### Mobile (`apps/mobile_app`)

- `lib/core/theme/app_theme.dart` (colors, light and dark themes) and `theme_provider.dart` (user choice, `theme_settings_screen.dart`). Light background `#F5F5F5`, surfaces white, text `#212121` / `#757575`; dark background `#181C1F`, surface `#23272A`.

## Invariants: never change without the owner's explicit approval

- The brand teal and its scales; the light and dark palettes of each surface.
- Fonts: Roboto (website), Inter (admin), the app theme's typography.
- The component libraries: HeroUI on the website, shadcn/Radix in the admin. No new UI library, no swapping one for the other.
- Layout language: the website's navigation, hero and sections, the members area structure, the admin shell (sidebar, page header, breadcrumbs), the app's navigation.
- Motion vocabulary: no new animation styles; the anniversary experience stays as designed.
- Voice: French, warm, associative. UI copy changes are content decisions; propose them.

A change to any of these is a **breaking change**: show before/after and wait for a decision.

## Improvements you can make without asking

- **Accessibility within the palette.** _Measured_: white on `#1A878D` is **4.29:1**, below WCAG AA's 4.5:1 for normal-size text (fine for large or bold text, ≥ 3:1); teal `#1A878D` text on the dark background `#0d1616` is 4.28:1. Where small text sits on teal, use the darker step `--primary-600` `#156c71` (6.15:1 with white); for teal text in dark mode, use the dark scale's `#26a5ad` (6.18:1). Also: visible focus, target sizes (WCAG 2.2 §2.5.8, at least 24×24 px), reduced-motion guards, accessible names, heading order, form errors announced.
- **Consistency**: use the existing pieces (HeroUI components and tokens on the website; `components/ui` and `data-state` in the admin; `AppTheme` in the app) instead of one-off styles; replace raw hex and arbitrary values with tokens.
- **States**: skeletons that match the real layout, empty and error states, pending buttons.
- **Dark mode**: fix surfaces that hard-code light colors.
- **Responsive polish**: no horizontal scroll at 390px, readable line lengths, correct image `sizes`.
- **Performance that doesn't change the look**: image sizing and priority, fewer client components, no layout shift.

A new token or shared component is allowed when it names something already repeated by hand in several places; add it where its surface keeps tokens, migrate the call sites in the same PR, and note it in this page.

## Verifying a visual change

1. Screenshot the affected pages **before** touching code: 390×844 and 1280×800, light and dark (website, admin); a small and a large phone, light and dark (app).
2. Take the same shots after and compare. At rest, anything that changed must be intended; list it in the PR.
3. Check keyboard (Tab order, visible focus, Escape closes overlays) and reduced motion for anything interactive or animated.
4. Check contrast with numbers (WCAG ratio) for any text or state you touched.
5. Attach the screenshots to the PR; send the owner the before/after pair for pages he cares about (home, concerts, members area, donation, the anniversary pages).

## Anti-patterns to refuse, even if asked casually

- A component library's default look where the project has its own (HeroUI v3 defaults are "grayish/bluish"; the site deliberately keeps v2's pure white and teal).
- Hand-rolled loading, empty or error UI in the admin.
- New animation libraries or scroll listeners next to existing ones.
- Changing the teal "a little" to fix contrast: use the existing darker or lighter steps instead.
