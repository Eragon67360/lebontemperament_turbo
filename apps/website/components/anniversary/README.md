# 40ème Anniversaire - Documentation Technique

## Vue d'ensemble

La page `/40-ans` célèbre les 40 ans du Bon Tempérament : un programme de concert de gala (direction D), nourri par le CMS de l'admin, avec les galeries vidéo, audio et photo et le livre d'or.

## Structure des Composants

La page suit la direction D « Le Programme » choisie par le propriétaire (octobre 2026), qui remplace la direction A « Mesure 40 » : la page se lit comme le programme d'un concert de gala. Polices Bodoni Moda (titres, `--font-programme-display`) et EB Garamond (texte, `--font-programme-text`), chargées par `app/40-ans/page.tsx` pour cette page seulement ; Roboto pour les petites capitales et les boutons. Tons papier (ivoire, papier, filets) en jetons de page dans `programme/theme.ts`, avec une variante sombre ; le teal du site comme accent. Logique pure et testée : `lib/anniversaryProgramme.ts` (chiffres romains, saisons, affiches).

### 1. `programme/ProgrammeCover.tsx`

Couverture : sur teal profond dans un filet, un grand « 40 » (`hero_number`) en Bodoni découpé dans une photo de concert (`public/img/entre_terre_et_ciel.jpg`, optimisée par `getImageProps`) qui glisse lentement, le titre (`hero_subtitle`) en italique, MCMLXXXVII — MMXXVII, le bouton du CMS (`cta_text` → `cta_target_section`), « Concert des 40 ans » (vers le billet) et les statistiques. Statique si `enable_intro_animation` est désactivé ou si le visiteur préfère réduire les animations.

### 2. `programme/ProgrammeContents.tsx` (`#anniversary-navigation`)

« Au programme » : une ligne numérotée (I, II…) par carte de navigation du CMS, avec points de conduite et la marque de la section (`programme/sections.ts`), puis le grand concert anniversaire ; à côté, une photo et le texte `description` du CMS.

### 3. `programme/ProgrammeSeasons.tsx` (`#timeline`)

« Première partie · Quarante saisons » : un événement de la frise par saison (année en Bodoni, titre, texte), la photo de la galerie de la même année et les souvenirs mis en avant de la période (un souvenir rejoint la dernière saison commencée avant ou pendant son année). « Vous y étiez ? Signez le livre d'or » reporte l'année dans le formulaire.

### 4. `programme/ProgrammeEntracte.tsx`, `ProgrammeDistribution.tsx`, `ProgrammeArchives.tsx` (`#archives`), `ProgrammeTicket.tsx` (`#billet`)

« Entracte » : la citation de Simone Duclos. « Distribution » : les chœurs, l'orchestre et leurs chefs, et la photo de toute la troupe (Camino Latino, Châteaulin, août 2023). « Les archives » : une pile du disque des 20 ans et des affiches de concerts récents (table `concerts`, une par programme, sans les `E2E_`, `getProgrammePosters`), puis le lien vers `/40-ans/archives`. Le billet du grand concert renvoie à l'agenda : aucune date ni aucun lieu n'est inventé. Les sections média et le livre d'or (`MemorySharing.tsx`) gardent leur contenu, avec l'en-tête commun `programme/ProgrammeHeading.tsx`.

### 5. `VideoGallery.tsx`

Galerie vidéo (`anniversary_videos`, props `videos`) : grille, filtres par catégorie, badge d'année, vignettes `CloudinaryImage` ; une vidéo s'ouvre dans `VideoModal.tsx` (YouTube).

### 6. `AudioMemories.tsx`

Souvenirs sonores (`anniversary_audio_memories`, props `audioMemories`) : un `CustomAudioPlayer.tsx` (react-h5-audio-player) par souvenir, avec le locuteur et l'année.

### 7. `PhotoCollection.tsx`

Galerie photo (`anniversary_photos`, props `photos`) : grille responsive en `CloudinaryImage`, filtres par catégorie, agrandissement dans une superposition.

### 8. `MemorySharing.tsx`

Livre d'or : les souvenirs mis en avant (`anniversary_memories`, props `featuredMemories`) et le formulaire, dont les textes et l'état viennent de `anniversary_form_config` (props `config`). L'envoi part vers `POST /api/anniversary/submit-memory` avec un champ-piège et un temps de remplissage minimal (`@repo/domain/utils/formAbuse`) ; un souvenir est enregistré `is_approved: false` et attend la modération dans l'admin. `prefillYear` reporte l'année choisie sur une saison.

## Contenu

Tout le contenu vient du CMS de l'admin (« Campagne 40 ans » : en-tête, chiffres clés, cartes de navigation, chronologie, vidéos, souvenirs audio, photos, archives, témoignages, formulaire, modération), lu côté serveur par `lib/anniversary.ts` (`getAnniversaryPageData`, tables `anniversary_*`) et transmis en props ; les médias sont sur Cloudinary. Rien n'est codé en dur dans les composants. La page n'est servie que si le drapeau `anniversary_40_years` est actif, ou aux admins (`app/40-ans/page.tsx`, sinon 404).

## Performance et Optimisations

### Images

- `CloudinaryImage` pour les images du CMS, `getImageProps` pour la photo de couverture
- Lazy loading automatique avec `loading="lazy"`

### Animations

- Aucune bibliothèque dédiée : `motion` (`motion/react`) pour l'animation d'entrée de la couverture et les apparitions au défilement (`MotionSection`)
- `prefers-reduced-motion` respecté (`hooks/useReducedMotion.ts`) : la couverture est alors statique

### Code Splitting

- Tous les composants sont en "use client" pour le code splitting
- Lazy loading possible avec `dynamic` de Next.js si nécessaire

### Responsive Design

- Breakpoints: mobile, tablette, desktop
- Grids adaptatifs avec `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Textes avec `clamp()` et tailles responsives

## Accessibilité

- Support `prefers-reduced-motion`
- Contraste des couleurs respecté
- Navigation au clavier
- Labels ARIA implicites via sémantique HTML
- Skip links pour l'animation d'entrée
- Les trois superpositions (photo, vidéo, PDF) sont des dialogues modaux (`role="dialog"`, nommés par leur titre) : `hooks/useModalDialog.ts` y déplace le focus, garde Tab à l'intérieur, ferme à Échap et rend le focus au déclencheur ; les filtres des galeries exposent `aria-pressed`

## Personnalisation

### Couleurs

Les tons papier et le teal d'accent sont des jetons de page dans `programme/theme.ts` (variante sombre comprise) ; les composants n'ont ni couleur en dur ni dégradé ([design guardrails](../../../../docs/agents/design-guardrails.md)).

### Animations

- Durées et délais dans les props `transition` de `motion`
- Rien ne bouge quand `prefers-reduced-motion` est actif

## Pour aller plus loin

- Les textes et les médias se changent dans l'admin, pas dans le code.
- Les métadonnées et le JSON-LD sont dans `app/40-ans/page.tsx` ; les aperçus de liens dans `lib/og/`.
- Les entrées vers la page (navigation, menu du téléphone, carte de l'accueil) sont décrites dans `INTEGRATION_GUIDE.md`.

## Notes Techniques

- Tous les composants sont TypeScript avec interfaces définies
- Utilisation de Tailwind CSS pour le styling
- Compatible avec le système de thème dark/light existant
- Respecte les patterns du projet (MotionSection, etc.)
