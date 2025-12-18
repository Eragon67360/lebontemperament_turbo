# Structure de Contenu - 40ème Anniversaire

Ce document décrit la structure de contenu nécessaire pour remplacer les placeholders.

## 1. Vidéos (VideoGallery)

### Format Requis

- **Thumbnail**: Image 16:9 (recommandé: 1280x720px)
- **Vidéo**: YouTube, Vimeo, ou fichier MP4
- **Métadonnées**: Titre, description, année, catégorie

### Catégories Disponibles

- Concert
- Témoignage
- Documentaire
- Éducation
- Tournée

### Exemple de Structure

```json
{
  "id": "unique-id",
  "title": "Titre du Concert",
  "description": "Description détaillée du contenu vidéo",
  "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "year": 2024,
  "category": "Concert"
}
```

## 2. Audio (AudioMemories)

### Format Requis

- **Fichier Audio**: MP3, OGG, ou WAV
- **Durée**: Format "MM:SS"
- **Métadonnées**: Titre, description, locuteur, année

### Types de Contenu

- Témoignages oraux
- Extraits musicaux historiques
- Messages de félicitations
- Interviews

### Exemple de Structure

```json
{
  "id": "unique-id",
  "title": "Souvenirs de la Création",
  "description": "Description du contenu audio",
  "speaker": "Simone Duclos",
  "year": 2024,
  "duration": "5:32",
  "audioUrl": "/audio/souvenirs-creation.mp3"
}
```

## 3. Photos (PhotoCollection)

### Format Requis

- **Image**: JPG, PNG, ou WebP
- **Ratio**: Flexible (recommandé: 4:3 ou 16:9)
- **Résolution**: Minimum 1200px sur le côté le plus long
- **Métadonnées**: Titre, année, catégorie, description optionnelle

### Catégories Disponibles

- Concert
- Studio
- Tournée
- Répétition
- Événement
- Éducation
- Portrait

### Exemple de Structure

```json
{
  "id": "unique-id",
  "title": "Concert Inaugural 1984",
  "year": 1984,
  "category": "Concert",
  "imageUrl": "https://res.cloudinary.com/.../concert-1984.jpg",
  "description": "Description optionnelle de la photo"
}
```

## 4. Timeline (AnniversaryTimeline)

### Événements Clés Requis

- **Année**: Entre 1984 et 2024
- **Titre**: Court et impactant
- **Description**: 2-3 phrases décrivant l'événement
- **Icône**: Choisir parmi FaMusic, FaTrophy, FaUsers, FaCalendarAlt
- **Couleur**: Gradient (ex: "from-amber-500 to-orange-500")

### Exemple de Structure

```json
{
  "year": 1984,
  "title": "La Création",
  "description": "Description détaillée de l'événement historique...",
  "icon": "FaMusic",
  "color": "from-amber-500 to-orange-500"
}
```

### Suggestions d'Événements

- Création (1984)
- Premier enregistrement
- Première tournée
- Anniversaires (10, 25, 30 ans)
- Événements marquants
- Changements de direction
- Collaborations importantes
- 40 ans (2024)

## 5. Témoignages (MemorySharing)

### Format Requis

- **Auteur**: Nom complet
- **Rôle**: Fonction ou relation avec l'ensemble
- **Année**: Année du témoignage ou période de participation
- **Contenu**: 2-4 phrases
- **Avatar**: Photo optionnelle (100x100px recommandé)

### Exemple de Structure

```json
{
  "id": "unique-id",
  "author": "Marie Dupont",
  "role": "Membre Fondateur",
  "year": 1984,
  "content": "Témoignage complet avec souvenirs et anecdotes...",
  "avatar": "https://res.cloudinary.com/.../avatar.jpg"
}
```

### Types de Témoignages

- Membres fondateurs
- Anciens membres
- Membres actuels
- Directeurs musicaux
- Amis et supporters
- Familles des membres

## 6. Statistiques (AnniversaryLanding)

### Données Requises

- Nombre d'années (40)
- Nombre approximatif de concerts
- Nombre approximatif de membres (passés et présents)
- Nombre de CDs enregistrés

### Mise à Jour

Modifier dans `AnniversaryLanding.tsx`:

```typescript
{ icon: FaCalendarAlt, number: "40", label: "Années" },
{ icon: FaMusic, number: "200+", label: "Concerts" },
{ icon: FaUsers, number: "500+", label: "Membres" },
{ icon: FaTrophy, number: "15+", label: "CDs" },
```

## Checklist d'Intégration

### Phase 1: Préparation

- [ ] Collecter toutes les photos historiques
- [ ] Numériser les enregistrements audio/vidéo anciens
- [ ] Organiser le contenu par année et catégorie
- [ ] Préparer les textes en français

### Phase 2: Médias

- [ ] Uploader les images sur Cloudinary ou CDN
- [ ] Uploader les fichiers audio
- [ ] Préparer les vidéos (YouTube/Vimeo ou fichiers)
- [ ] Créer les thumbnails pour les vidéos

### Phase 3: Contenu Textuel

- [ ] Rédiger les descriptions pour chaque média
- [ ] Finaliser la timeline avec les vrais événements
- [ ] Collecter et valider les témoignages
- [ ] Vérifier l'orthographe et la grammaire

### Phase 4: Intégration

- [ ] Remplacer les placeholders dans VideoGallery
- [ ] Remplacer les placeholders dans AudioMemories
- [ ] Remplacer les placeholders dans PhotoCollection
- [ ] Mettre à jour la Timeline avec les vrais événements
- [ ] Intégrer les vrais témoignages

### Phase 5: Tests

- [ ] Tester tous les médias (chargement, lecture)
- [ ] Vérifier le responsive sur mobile/tablette/desktop
- [ ] Tester les animations et interactions
- [ ] Valider l'accessibilité
- [ ] Vérifier les performances (lighthouse)

## Recommandations

### Images

- Utiliser Cloudinary pour l'optimisation automatique
- Formats: WebP pour la performance, JPG/PNG en fallback
- Compression: 80-85% pour un bon équilibre qualité/taille

### Vidéos

- Préférer YouTube/Vimeo pour le streaming
- Si fichiers directs: MP4 H.264, résolution max 1080p
- Thumbnails: 1280x720px minimum

### Audio

- Format MP3, bitrate 128-192 kbps
- Durée recommandée: 3-10 minutes pour les témoignages
- Normaliser le volume entre les fichiers

### Performance

- Lazy load les médias non visibles immédiatement
- Utiliser des placeholders/blur pour les images
- Optimiser les fichiers avant upload
