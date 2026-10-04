# 40ème Anniversaire - Documentation Technique

## Vue d'ensemble

Cette page de célébration des 40 ans du Bon Tempérament est une expérience interactive et immersive qui combine animations spectaculaires, contenu multimédia et témoignages.

## Structure des Composants

La page suit la direction A « Mesure 40 » choisie par le propriétaire (octobre 2026) : la page est une partition. Police d'affichage Fraunces (`--font-score`, chargée par `app/40-ans/page.tsx` pour cette page seulement), Roboto pour le texte, le teal du site comme seul accent.

### 1. `score/ScoreHero.tsx`

Ouverture : une portée de cinq lignes se trace, une mesure 4/0 (`hero_number`) s'installe, une note par décennie (1987, 1997, 2007, 2017) tombe sur la portée et 2027 reçoit le point d'orgue. Titre (`hero_subtitle`), texte (`description`), bouton (`cta_text` → `cta_target_section`) et statistiques du CMS. Statique si `enable_intro_animation` est désactivé ou si le visiteur préfère réduire les animations.

### 2. `score/ScoreTimeline.tsx` (`#timeline`)

« La partition des 40 ans » : 40 mesures (1987 à 2026), dix par ligne, puis 2027 en point d'orgue. Les événements de la frise et les souvenirs mis en avant (avec une année) sont les notes ; une année vide est un silence qui invite à écrire un souvenir (l'année est reportée dans le formulaire). Les mesures forment un groupe radio (flèches, Début, Fin) ; « Jouer la partition » les parcourt. Une photo de la galerie de la même année s'affiche à côté. Logique pure et testée : `lib/anniversaryScore.ts`. Les années hors 1987–2027 sont ramenées à la première mesure ou au point d'orgue.

### 3. `score/ScoreVoices.tsx`, `score/ScoreMovements.tsx` (`#anniversary-navigation`), `score/ScoreFine.tsx`

« Tutti » : les chœurs, l'orchestre et leurs chefs, avec la citation de Simone Duclos. « Le programme » : les cartes de navigation du CMS, marquées par le tempo de leur section (`score/sections.ts` : Prélude, I · Allegro, II · Andante, III · Scherzo, IV · Adagio, Coda). « Fine » clôt la page. Les sections média gardent leur contenu, avec l'en-tête commun `score/ScoreHeading.tsx`.

### 4. `VideoGallery.tsx`

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

### 5. `AudioMemories.tsx`

**Rôle**: Lecteurs audio pour les souvenirs sonores

**Fonctionnalités**:

- Lecteurs audio avec react-h5-audio-player
- Témoignages audio
- Extraits musicaux historiques
- Design avec gradients purple/indigo

**Contenu**:

- 6 fichiers audio placeholder
- URLs à remplacer par les vrais fichiers

### 6. `PhotoCollection.tsx`

**Rôle**: Galerie photo en style masonry

**Fonctionnalités**:

- Layout masonry responsive
- Filtres par catégorie
- Modal lightbox pour agrandissement
- Hover effects avec informations

**Contenu**:

- 9 photos placeholder
- Images à remplacer par les vraies photos

### 7. `MemorySharing.tsx`

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
