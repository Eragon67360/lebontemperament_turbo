# 40ème Anniversaire - Documentation Technique

## Vue d'ensemble

Cette page de célébration des 40 ans du Bon Tempérament est une expérience interactive et immersive qui combine animations spectaculaires, contenu multimédia et témoignages.

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

**Rôle**: Galerie vidéo avec filtres par catégorie

**Fonctionnalités**:

- Grid responsive de vidéos
- Filtres par catégorie
- Overlay avec bouton play
- Badges d'année
- Placeholder pour intégration YouTube/Vimeo

**Contenu**:

- 6 vidéos placeholder
- Catégories: Concert, Témoignage, Documentaire, etc.

### 6. `AudioMemories.tsx`

**Rôle**: Lecteurs audio pour les souvenirs sonores

**Fonctionnalités**:

- Lecteurs audio avec react-h5-audio-player
- Témoignages audio
- Extraits musicaux historiques
- Design avec gradients purple/indigo

**Contenu**:

- 6 fichiers audio placeholder
- URLs à remplacer par les vrais fichiers

### 7. `PhotoCollection.tsx`

**Rôle**: Galerie photo en style masonry

**Fonctionnalités**:

- Layout masonry responsive
- Filtres par catégorie
- Modal lightbox pour agrandissement
- Hover effects avec informations

**Contenu**:

- 9 photos placeholder
- Images à remplacer par les vraies photos

### 8. `MemorySharing.tsx`

**Rôle**: Section témoignages et formulaire de partage

**Fonctionnalités**:

- Grid de témoignages existants
- Formulaire de soumission de témoignage
- Design avec icônes et citations
- Validation et soumission (à connecter à l'API)

**Contenu**:

- 6 témoignages placeholder
- Formulaire à connecter au backend

## Intégration du Contenu Réel

### Remplacement des Placeholders

#### Vidéos (`VideoGallery.tsx`)

```typescript
// Remplacer dans videoItems array
{
  id: "1",
  title: "Titre réel",
  description: "Description réelle",
  thumbnail: "URL Cloudinary ou CDN",
  videoUrl: "URL YouTube/Vimeo ou fichier vidéo",
  year: 2024,
  category: "Concert"
}
```

#### Audio (`AudioMemories.tsx`)

```typescript
// Remplacer les URLs audio
{
  id: "1",
  title: "Titre réel",
  description: "Description réelle",
  speaker: "Nom du locuteur",
  year: 2024,
  duration: "5:32",
  audioUrl: "/audio/reel-fichier.mp3" // Chemin vers le fichier réel
}
```

#### Photos (`PhotoCollection.tsx`)

```typescript
// Remplacer les URLs d'images
{
  id: "1",
  title: "Titre réel",
  year: 1984,
  category: "Concert",
  imageUrl: "URL Cloudinary ou CDN",
  description: "Description réelle"
}
```

#### Timeline (`AnniversaryTimeline.tsx`)

```typescript
// Mettre à jour les événements réels
{
  year: 1984,
  title: "Titre réel de l'événement",
  description: "Description détaillée réelle",
  icon: FaMusic, // Choisir l'icône appropriée
  color: "from-amber-500 to-orange-500" // Gradient de couleur
}
```

#### Témoignages (`MemorySharing.tsx`)

```typescript
// Remplacer par les vrais témoignages
{
  id: "1",
  author: "Nom réel",
  role: "Rôle réel",
  year: 1984,
  content: "Témoignage réel",
  avatar: "URL Cloudinary ou CDN"
}
```

## Performance et Optimisations

### Images

- Utilisation de `img` tags pour les placeholders
- Pour les images réelles, considérer CloudinaryImage pour l'optimisation
- Lazy loading automatique avec `loading="lazy"`

### Animations

- GSAP utilisé uniquement pour l'animation d'entrée
- Motion (Framer Motion) pour les animations de scroll (plus performant)
- `prefers-reduced-motion` respecté automatiquement

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

## Personnalisation

### Couleurs

Les gradients peuvent être modifiés dans chaque composant:

- Amber/Orange pour le landing
- Blue/Cyan pour la timeline
- Purple/Indigo pour l'audio
- Green/Emerald pour les photos
- Rose/Red pour les témoignages

### Animations

- Durées ajustables dans les props `transition`
- Délais (`delay`) configurables
- Types d'easing personnalisables

## Prochaines Étapes

1. **Intégration du contenu réel**
   - Remplacer tous les placeholders
   - Uploader les médias (vidéos, audio, photos)
   - Valider les textes en français

2. **Backend Integration**
   - Connecter le formulaire de témoignages à une API
   - Système de modération des témoignages
   - Gestion dynamique du contenu (CMS optionnel)

3. **Améliorations possibles**
   - Lightbox avancé pour les photos (yet-another-react-lightbox déjà installé)
   - Intégration YouTube/Vimeo pour les vidéos
   - Partage social des témoignages
   - Export PDF de la timeline

4. **SEO**
   - Métadonnées déjà configurées dans `page.tsx`
   - Ajouter des structured data (JSON-LD) pour les événements
   - Optimiser les images avec alt text descriptifs

## Notes Techniques

- Tous les composants sont TypeScript avec interfaces définies
- Utilisation de Tailwind CSS pour le styling
- Compatible avec le système de thème dark/light existant
- Respecte les patterns du projet (MotionSection, etc.)
