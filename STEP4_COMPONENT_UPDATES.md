# STEP 4: Component Updates Summary

## Components to Update

### 1. ✅ AnniversaryLanding.tsx

**Props needed:** `hero: AnniversaryHero`
**Hardcoded data to replace:**

- "40 ANS" → `hero.hero_number`
- "De Passion Musicale" → `hero.hero_subtitle`
- Description paragraph → `hero.description`
- "Découvrir Notre Histoire" button → `hero.cta_text`
- Button target → `hero.cta_target_section`
- "Passer l'animation" → `hero.skip_button_text`
- Animation enable/disable → `hero.enable_intro_animation`

### 2. ✅ AnniversaryNavigation.tsx

**Props needed:** `cards: NavigationCard[]`
**Hardcoded data to replace:**

- Navigation cards array → map over `cards` prop
- Each card: title, description, icon_name, target_section_id

### 3. ✅ AnniversaryTimeline.tsx

**Props needed:** `events: TimelineEvent[]`
**Hardcoded data to replace:**

- Timeline events array → map over `events` prop
- Each event: year, title, description, icon_name

### 4. ✅ VideoGallery.tsx

**Props needed:** `videos: Video[]`
**Hardcoded data to replace:**

- Videos array → map over `videos` prop
- Each video: title, description, thumbnail_url, video_url, year, category

### 5. ✅ AudioMemories.tsx

**Props needed:** `audioMemories: AudioMemory[]`
**Hardcoded data to replace:**

- Audio memories array → map over `audioMemories` prop
- Each memory: title, description, speaker_name, year, duration, audio_url

### 6. ✅ PhotoCollection.tsx

**Props needed:** `photos: Photo[]`
**Hardcoded data to replace:**

- Photos array → map over `photos` prop
- Each photo: title, description, year, category, image_url

### 7. ✅ MemorySharing.tsx

**Props needed:** `config: FormConfig, featuredMemories: Memory[]`
**Hardcoded data to replace:**

- Form configuration:
  - section_title
  - section_description
  - name_label, email_label, message_label, year_label
  - submit_button_text
  - success_message
  - is_enabled (conditionally render)
- Featured memories list → map over `featuredMemories` prop

## Implementation Strategy

Due to file size and complexity, updating components in 2 batches:

**Batch 1:** AnniversaryLanding, AnniversaryNavigation, AnniversaryTimeline, VideoGallery  
**Batch 2:** AudioMemories, PhotoCollection, MemorySharing

Each update will:

1. Add prop interface
2. Replace hardcoded values with props
3. Maintain all existing animations and styling
4. Handle empty states gracefully

## Status

- [x] Types created
- [x] API routes created
- [ ] Batch 1 components
- [ ] Batch 2 components
- [ ] Testing

---

**Next:** Systematically update each component file.
