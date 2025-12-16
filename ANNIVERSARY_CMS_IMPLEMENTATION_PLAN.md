# Anniversary CMS - Implementation Plan

## 🎯 Overview

Incremental implementation of the Anniversary CMS system, focusing on admin panel first, then website integration.

---

## 📦 STEP 1: Admin Backend Foundation

### **1.1 TypeScript Types** (`apps/admin/types/anniversary.ts`)

Create comprehensive type definitions for all content sections:

```typescript
// Core entity types
export interface AnniversaryHero {
  id: string;
  hero_number: string;
  hero_subtitle: string;
  description: string | null;
  cta_text: string;
  cta_target_section: string;
  enable_intro_animation: boolean;
  skip_button_text: string;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryNavigationCard {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  target_section_id: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryTimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string | null;
  year: number | null;
  category: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryAudioMemory {
  id: string;
  title: string;
  description: string;
  speaker_name: string | null;
  year: number | null;
  duration: string;
  audio_url: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryPhoto {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  category: string;
  image_url: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryFormConfig {
  id: string;
  section_title: string;
  section_description: string;
  name_label: string;
  email_label: string;
  message_label: string;
  year_label: string;
  submit_button_text: string;
  success_message: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnniversaryMemory {
  id: string;
  name: string;
  email: string;
  message: string;
  year: number | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// DTO types for create/update operations
export interface UpdateAnniversaryHeroDTO {
  hero_number?: string;
  hero_subtitle?: string;
  description?: string | null;
  cta_text?: string;
  cta_target_section?: string;
  enable_intro_animation?: boolean;
  skip_button_text?: string;
}

export interface CreateNavigationCardDTO {
  title: string;
  description: string;
  icon_name: string;
  target_section_id: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateNavigationCardDTO extends Partial<CreateNavigationCardDTO> {}

export interface CreateTimelineEventDTO {
  year: number;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateTimelineEventDTO extends Partial<CreateTimelineEventDTO> {}

export interface CreateVideoDTO {
  title: string;
  description: string;
  thumbnail_url: string;
  video_url?: string | null;
  year?: number | null;
  category: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateVideoDTO extends Partial<CreateVideoDTO> {}

export interface CreateAudioMemoryDTO {
  title: string;
  description: string;
  speaker_name?: string | null;
  year?: number | null;
  duration: string;
  audio_url: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateAudioMemoryDTO extends Partial<CreateAudioMemoryDTO> {}

export interface CreatePhotoDTO {
  title: string;
  description?: string | null;
  year?: number | null;
  category: string;
  image_url: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdatePhotoDTO extends Partial<CreatePhotoDTO> {}

export interface UpdateFormConfigDTO {
  section_title?: string;
  section_description?: string;
  name_label?: string;
  email_label?: string;
  message_label?: string;
  year_label?: string;
  submit_button_text?: string;
  success_message?: string;
  is_enabled?: boolean;
}

export interface UpdateMemoryDTO {
  is_approved?: boolean;
  is_featured?: boolean;
}

// Cloudinary upload response
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

// Icon options (predefined list for UI)
export const ICON_OPTIONS = [
  "FaMusic",
  "FaTrophy",
  "FaUsers",
  "FaCalendarAlt",
  "FaHistory",
  "FaVideo",
  "FaHeadphones",
  "FaImages",
  "FaHeart",
] as const;

export type IconName = (typeof ICON_OPTIONS)[number];
```

**File:** `apps/admin/types/anniversary.ts`

---

### **1.2 API Routes** (`apps/admin/app/api/anniversary/`)

Create 8 API route files with CRUD operations:

#### **1.2.1 Hero API** (`apps/admin/app/api/anniversary/hero/route.ts`)

- **GET**: Fetch hero content (singleton)
- **PATCH**: Update hero content
- Auth: Admin/Superadmin only

#### **1.2.2 Navigation Cards API** (`apps/admin/app/api/anniversary/navigation/route.ts`)

- **GET**: Fetch all cards (with visibility filter for admins)
- **POST**: Create new card
- **PATCH**: Update card (requires `id` in body)
- **DELETE**: Delete card (requires `id` in query)
- Auth: Admin/Superadmin only

#### **1.2.3 Timeline Events API** (`apps/admin/app/api/anniversary/timeline/route.ts`)

- **GET**: Fetch all events
- **POST**: Create new event
- **PATCH**: Update event
- **DELETE**: Delete event
- Auth: Admin/Superadmin only

#### **1.2.4 Videos API** (`apps/admin/app/api/anniversary/videos/route.ts`)

- **GET**: Fetch all videos
- **POST**: Create new video
- **PATCH**: Update video
- **DELETE**: Delete video
- Auth: Admin/Superadmin only

#### **1.2.5 Audio Memories API** (`apps/admin/app/api/anniversary/audio/route.ts`)

- **GET**: Fetch all audio memories
- **POST**: Create new audio memory
- **PATCH**: Update audio memory
- **DELETE**: Delete audio memory
- Auth: Admin/Superadmin only

#### **1.2.6 Photos API** (`apps/admin/app/api/anniversary/photos/route.ts`)

- **GET**: Fetch all photos
- **POST**: Create new photo
- **PATCH**: Update photo
- **DELETE**: Delete photo
- Auth: Admin/Superadmin only

#### **1.2.7 Form Config API** (`apps/admin/app/api/anniversary/form-config/route.ts`)

- **GET**: Fetch form config (singleton)
- **PATCH**: Update form config
- Auth: Admin/Superadmin only

#### **1.2.8 Memories API** (`apps/admin/app/api/anniversary/memories/route.ts`)

- **GET**: Fetch all user submissions (for moderation)
- **PATCH**: Update memory (approve/feature)
- **DELETE**: Delete memory
- Auth: Admin/Superadmin only

#### **1.2.9 Upload API** (`apps/admin/app/api/anniversary/upload/route.ts`)

- **POST**: Upload file to Cloudinary
  - Accepts: `multipart/form-data` with `file` field
  - Returns: `{ url: string, publicId: string }`
  - Supports: images (jpg, png, webp) and audio (mp3, wav)
  - Auto-detects resource type
- Auth: Admin/Superadmin only

**Pattern for all routes:**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuthorization } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("table_name")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

### **1.3 TanStack Query Hooks** (`apps/admin/hooks/`)

Create 8 hook files for data management:

#### **1.3.1 Hero Hooks** (`apps/admin/hooks/useAnniversaryHero.ts`)

```typescript
export function useAnniversaryHero() {
  return useQuery({
    queryKey: ["anniversary", "hero"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/hero");
      if (!response.ok) throw new Error("Failed to fetch hero");
      return response.json() as Promise<AnniversaryHero>;
    },
  });
}

export function useUpdateAnniversaryHero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateAnniversaryHeroDTO) => {
      const response = await fetch("/api/anniversary/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update hero");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "hero"] });
    },
  });
}
```

#### **1.3.2 Navigation Cards Hooks** (`apps/admin/hooks/useAnniversaryNavigation.ts`)

- `useNavigationCards()` - query
- `useCreateNavigationCard()` - mutation
- `useUpdateNavigationCard()` - mutation
- `useDeleteNavigationCard()` - mutation

#### **1.3.3 Timeline Events Hooks** (`apps/admin/hooks/useAnniversaryTimeline.ts`)

- `useTimelineEvents()` - query
- `useCreateTimelineEvent()` - mutation
- `useUpdateTimelineEvent()` - mutation
- `useDeleteTimelineEvent()` - mutation

#### **1.3.4 Videos Hooks** (`apps/admin/hooks/useAnniversaryVideos.ts`)

- `useVideos()` - query
- `useCreateVideo()` - mutation
- `useUpdateVideo()` - mutation
- `useDeleteVideo()` - mutation

#### **1.3.5 Audio Memories Hooks** (`apps/admin/hooks/useAnniversaryAudio.ts`)

- `useAudioMemories()` - query
- `useCreateAudioMemory()` - mutation
- `useUpdateAudioMemory()` - mutation
- `useDeleteAudioMemory()` - mutation

#### **1.3.6 Photos Hooks** (`apps/admin/hooks/useAnniversaryPhotos.ts`)

- `usePhotos()` - query
- `useCreatePhoto()` - mutation
- `useUpdatePhoto()` - mutation
- `useDeletePhoto()` - mutation

#### **1.3.7 Form Config Hooks** (`apps/admin/hooks/useAnniversaryFormConfig.ts`)

- `useFormConfig()` - query
- `useUpdateFormConfig()` - mutation

#### **1.3.8 Memories Hooks** (`apps/admin/hooks/useAnniversaryMemories.ts`)

- `useMemories()` - query (with filters: approved, pending)
- `useUpdateMemory()` - mutation (approve/feature)
- `useDeleteMemory()` - mutation

#### **1.3.9 Upload Hook** (`apps/admin/hooks/useAnniversaryUpload.ts`)

- `useUploadFile()` - mutation for Cloudinary uploads

---

## 🎨 STEP 2: Admin UI Structure

### **2.1 Update Sidebar** (`apps/admin/components/Sidebar.tsx`)

Add new submenu under "Anniversaire 40 ans":

```typescript
{
  section: "Anniversaire 40 ans",
  icon: FaBirthdayCake,
  visibleForRoles: ["admin", "superadmin"],
  items: [
    {
      name: "Gestion de la page",
      href: "/dashboard/admin/anniversary",
      icon: FaToggleOn,
    },
    {
      name: "Section Hero",
      href: "/dashboard/admin/anniversary/hero",
      icon: FaStar,
    },
    {
      name: "Cartes de Navigation",
      href: "/dashboard/admin/anniversary/navigation",
      icon: FaMap,
    },
    {
      name: "Chronologie",
      href: "/dashboard/admin/anniversary/timeline",
      icon: FaHistory,
    },
    {
      name: "Galerie Vidéo",
      href: "/dashboard/admin/anniversary/videos",
      icon: FaVideo,
    },
    {
      name: "Mémoires Audio",
      href: "/dashboard/admin/anniversary/audio",
      icon: FaHeadphones,
    },
    {
      name: "Collection Photos",
      href: "/dashboard/admin/anniversary/photos",
      icon: FaImages,
    },
    {
      name: "Configuration Formulaire",
      href: "/dashboard/admin/anniversary/form",
      icon: FaWpforms,
    },
    {
      name: "Modération Témoignages",
      href: "/dashboard/admin/anniversary/memories",
      icon: FaComments,
      badge: "pending_count", // Dynamic badge
    },
  ],
}
```

### **2.2 Create Page Structure**

Create folders and route files in `apps/admin/app/dashboard/admin/anniversary/`:

#### **2.2.1 Main Page** (already exists)

- `page.tsx` - Feature toggle page (already implemented)

#### **2.2.2 Hero Page**

- `hero/page.tsx`
- Layout: PageShell with title "Section Hero"
- Description: "Gérer le contenu de la section d'accueil de la page anniversaire"
- No "Add" button (singleton data)

#### **2.2.3 Navigation Cards Page**

- `navigation/page.tsx`
- Layout: PageShell with title "Cartes de Navigation"
- Description: "Gérer les cartes de navigation vers les différentes sections"
- Button: "+ Ajouter une carte"

#### **2.2.4 Timeline Events Page**

- `timeline/page.tsx`
- Layout: PageShell with title "Chronologie - 40 Ans d'Histoire"
- Description: "Gérer les événements marquants de la chronologie"
- Button: "+ Ajouter un événement"

#### **2.2.5 Videos Page**

- `videos/page.tsx`
- Layout: PageShell with title "Galerie Vidéo"
- Description: "Gérer les vidéos de concerts, témoignages et documentaires"
- Button: "+ Ajouter une vidéo"

#### **2.2.6 Audio Memories Page**

- `audio/page.tsx`
- Layout: PageShell with title "Mémoires Audio"
- Description: "Gérer les témoignages et extraits audio"
- Button: "+ Ajouter un souvenir audio"

#### **2.2.7 Photos Page**

- `photos/page.tsx`
- Layout: PageShell with title "Collection Photos"
- Description: "Gérer la galerie de photos des 40 ans"
- Button: "+ Ajouter une photo"

#### **2.2.8 Form Config Page**

- `form/page.tsx`
- Layout: PageShell with title "Configuration du Formulaire"
- Description: "Personnaliser le formulaire de partage de souvenirs"
- No "Add" button (singleton data)

#### **2.2.9 Memories Moderation Page**

- `memories/page.tsx`
- Layout: PageShell with title "Modération des Témoignages"
- Description: "Approuver et gérer les témoignages soumis par les visiteurs"
- Tabs: "En attente" | "Approuvés" | "Tous"

**Template for each page:**

```typescript
"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageName() {
  return (
    <PageShell
      title="Page Title"
      description="Page description"
      theme="admin"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {/* Stats or info */}
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Content area - empty for now */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Les composants seront ajoutés à l'étape 3
        </p>
      </div>
    </PageShell>
  );
}
```

---

## 🧩 STEP 3: Admin Components & Forms

### **3.1 Create Components Folder**

`apps/admin/components/anniversary/`

### **3.2 Shared Components**

#### **3.2.1 IconPicker** (`IconPicker.tsx`)

- Select from predefined icon list (ICON_OPTIONS)
- Visual preview of selected icon
- Used in: Navigation cards, Timeline events

#### **3.2.2 ImageUploader** (`ImageUploader.tsx`)

- Drag & drop zone
- Preview uploaded image
- Upload to Cloudinary via `/api/anniversary/upload`
- Returns relative pathname
- Used in: Videos (thumbnails), Photos

#### **3.2.3 AudioUploader** (`AudioUploader.tsx`)

- File input for audio files
- Upload progress indicator
- Upload to Cloudinary
- Used in: Audio memories

#### **3.2.4 OrderManager** (`OrderManager.tsx`)

- Drag-and-drop list for reordering
- Uses `@dnd-kit/sortable` or similar
- Updates `display_order` field
- Used in: Navigation, Timeline, Videos, Audio, Photos

#### **3.2.5 VisibilityToggle** (`VisibilityToggle.tsx`)

- Switch component for `is_visible` field
- Inline toggle on list items
- Used in: All multi-item lists

#### **3.2.6 DeleteConfirmDialog** (`DeleteConfirmDialog.tsx`)

- Confirmation modal before deletion
- Used in: All deletable items

### **3.3 Section-Specific Components**

#### **3.3.1 Hero Section** (`hero/`)

**Components:**

- `HeroInlineEditor.tsx` - Inline editable fields
  - Text inputs for title, subtitle, description
  - Switch for enable_intro_animation
  - Save button (auto-save optional)
  - Loading states

**Layout:** Single card with inline editing (no modal needed)

#### **3.3.2 Navigation Cards** (`navigation/`)

**Components:**

- `NavigationCardList.tsx` - List with drag-and-drop
- `NavigationCardItem.tsx` - Individual card display
- `NavigationCardDialog.tsx` - Modal for create/edit
  - Form fields: title, description, icon, target_section_id
  - Icon picker
  - Display order
  - Visibility toggle

**Layout:** Table/Grid view + Modal dialog

#### **3.3.3 Timeline Events** (`timeline/`)

**Components:**

- `TimelineEventList.tsx` - Chronological list with ordering
- `TimelineEventItem.tsx` - Event card with year badge
- `TimelineEventDialog.tsx` - Modal for create/edit
  - Form fields: year, title, description, icon
  - Icon picker
  - Display order
  - Visibility toggle

**Layout:** Timeline view + Modal dialog

#### **3.3.4 Videos** (`videos/`)

**Components:**

- `VideoList.tsx` - Grid view with thumbnails
- `VideoItem.tsx` - Video card with preview
- `VideoDialog.tsx` - Modal for create/edit
  - Form fields: title, description, category, year
  - Thumbnail uploader
  - Video URL input (YouTube embed validator)
  - Display order
  - Visibility toggle

**Layout:** Grid view + Modal dialog

#### **3.3.5 Audio Memories** (`audio/`)

**Components:**

- `AudioMemoryList.tsx` - List with audio player
- `AudioMemoryItem.tsx` - Audio card with mini player
- `AudioMemoryDialog.tsx` - Modal for create/edit
  - Form fields: title, description, speaker, year, duration
  - Audio file uploader
  - Display order
  - Visibility toggle

**Layout:** List view + Modal dialog

#### **3.3.6 Photos** (`photos/`)

**Components:**

- `PhotoList.tsx` - Masonry/Grid view
- `PhotoItem.tsx` - Photo card with lightbox
- `PhotoDialog.tsx` - Modal for create/edit
  - Form fields: title, description, category, year
  - Image uploader
  - Display order
  - Visibility toggle

**Layout:** Grid view + Modal dialog

#### **3.3.7 Form Config** (`form/`)

**Components:**

- `FormConfigInlineEditor.tsx` - Inline editable fields
  - All form label inputs
  - Success message
  - Enable/disable toggle
  - Save button

**Layout:** Single card with inline editing (no modal needed)

#### **3.3.8 Memories Moderation** (`memories/`)

**Components:**

- `MemoryList.tsx` - Tabbed list (Pending/Approved/All)
- `MemoryItem.tsx` - Memory card with actions
- `MemoryDetailDialog.tsx` - View full memory
  - Approve button
  - Feature toggle
  - Delete button

**Layout:** Tabbed list view + Detail modal

---

## 🌐 STEP 4: Website Integration

### **4.1 Website Types** (`apps/website/types/anniversary.ts`)

Copy/adapt types from admin types (without DTOs, simpler):

```typescript
export interface AnniversaryHero {
  // Same as admin but only fields needed for display
}

export interface AnniversaryNavigationCard {
  // Same as admin, only visible items
}

// ... etc for all types
```

### **4.2 Website API Routes** (`apps/website/app/api/anniversary/`)

Create **read-only** API routes (no auth required):

#### **4.2.1 Hero API** (`hero/route.ts`)

- **GET**: Fetch hero content

#### **4.2.2 Navigation API** (`navigation/route.ts`)

- **GET**: Fetch visible cards, ordered

#### **4.2.3 Timeline API** (`timeline/route.ts`)

- **GET**: Fetch visible events, ordered

#### **4.2.4 Videos API** (`videos/route.ts`)

- **GET**: Fetch visible videos, ordered
- Optional: Filter by category

#### **4.2.5 Audio API** (`audio/route.ts`)

- **GET**: Fetch visible audio memories, ordered

#### **4.2.6 Photos API** (`photos/route.ts`)

- **GET**: Fetch visible photos, ordered
- Optional: Filter by category

#### **4.2.7 Form Config API** (`form-config/route.ts`)

- **GET**: Fetch form configuration

#### **4.2.8 Memories Submit API** (`memories/route.ts`)

- **POST**: Submit new memory (no auth, rate-limited)

**All routes include Next.js caching:**

```typescript
export const revalidate = 300; // 5 minutes cache
```

### **4.3 Website Hooks** (`apps/website/hooks/`)

Create simple fetch hooks (no TanStack Query needed on website):

```typescript
// useAnniversaryContent.ts
export function useAnniversaryHero() {
  const [data, setData] = useState<AnniversaryHero | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/anniversary/hero")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// Similar for other sections...
```

**OR** use React Server Components for initial data:

- Fetch directly in Server Components
- No client-side hooks needed for static content

### **4.4 Update Website Components**

#### **4.4.1 AnniversaryLanding.tsx**

- Replace hardcoded text with data from `useAnniversaryHero()` or Server Component props
- Keep all animations intact

#### **4.4.2 AnniversaryNavigation.tsx**

- Replace `navigationCards` array with API data
- Map over fetched cards

#### **4.4.3 AnniversaryTimeline.tsx**

- Replace `timelineEvents` array with API data

#### **4.4.4 VideoGallery.tsx**

- Replace `videoItems` array with API data
- Keep filtering logic

#### **4.4.5 AudioMemories.tsx**

- Replace `audioMemories` array with API data

#### **4.4.6 PhotoCollection.tsx**

- Replace `photoCollections` array with API data
- Keep category filtering

#### **4.4.7 MemorySharing.tsx**

- Replace hardcoded labels with data from form config API
- Update submit handler to use new API endpoint
- Replace `testimonials` array with approved memories from API

### **4.5 Caching Strategy**

**Option A: Next.js Route Caching**

```typescript
export const revalidate = 300; // 5 minutes
```

**Option B: React Cache**

```typescript
import { cache } from "react";

export const getHeroContent = cache(async () => {
  const res = await fetch("/api/anniversary/hero");
  return res.json();
});
```

**Option C: Supabase Cache**

- Use `single()` queries with short TTL
- Rely on Supabase's built-in caching

**Recommendation:** Start with Option A (Route caching), simplest and effective.

---

## 📋 Implementation Checklist

### **STEP 1: Backend Foundation** ⏳

- [ ] 1.1 Create `apps/admin/types/anniversary.ts` with all types
- [ ] 1.2.1 Create Hero API route
- [ ] 1.2.2 Create Navigation Cards API route
- [ ] 1.2.3 Create Timeline Events API route
- [ ] 1.2.4 Create Videos API route
- [ ] 1.2.5 Create Audio Memories API route
- [ ] 1.2.6 Create Photos API route
- [ ] 1.2.7 Create Form Config API route
- [ ] 1.2.8 Create Memories API route
- [ ] 1.2.9 Create Upload API route (Cloudinary)
- [ ] 1.3.1 Create Hero hooks
- [ ] 1.3.2 Create Navigation Cards hooks
- [ ] 1.3.3 Create Timeline Events hooks
- [ ] 1.3.4 Create Videos hooks
- [ ] 1.3.5 Create Audio Memories hooks
- [ ] 1.3.6 Create Photos hooks
- [ ] 1.3.7 Create Form Config hooks
- [ ] 1.3.8 Create Memories hooks
- [ ] 1.3.9 Create Upload hook

### **STEP 2: UI Structure** ⏳

- [ ] 2.1 Update Sidebar with anniversary submenu
- [ ] 2.2.2 Create `hero/page.tsx` (layout only)
- [ ] 2.2.3 Create `navigation/page.tsx` (layout only)
- [ ] 2.2.4 Create `timeline/page.tsx` (layout only)
- [ ] 2.2.5 Create `videos/page.tsx` (layout only)
- [ ] 2.2.6 Create `audio/page.tsx` (layout only)
- [ ] 2.2.7 Create `photos/page.tsx` (layout only)
- [ ] 2.2.8 Create `form/page.tsx` (layout only)
- [ ] 2.2.9 Create `memories/page.tsx` (layout only)

### **STEP 3: Components & Forms** ⏳

- [ ] 3.1 Create `apps/admin/components/anniversary/` folder
- [ ] 3.2.1 Create IconPicker component
- [ ] 3.2.2 Create ImageUploader component
- [ ] 3.2.3 Create AudioUploader component
- [ ] 3.2.4 Create OrderManager component
- [ ] 3.2.5 Create VisibilityToggle component
- [ ] 3.2.6 Create DeleteConfirmDialog component
- [ ] 3.3.1 Create Hero inline editor + integrate into page
- [ ] 3.3.2 Create Navigation Cards components + integrate into page
- [ ] 3.3.3 Create Timeline Events components + integrate into page
- [ ] 3.3.4 Create Videos components + integrate into page
- [ ] 3.3.5 Create Audio Memories components + integrate into page
- [ ] 3.3.6 Create Photos components + integrate into page
- [ ] 3.3.7 Create Form Config inline editor + integrate into page
- [ ] 3.3.8 Create Memories moderation components + integrate into page

### **STEP 4: Website Integration** ⏳

- [ ] 4.1 Create `apps/website/types/anniversary.ts`
- [ ] 4.2.1 Create Hero API route (website)
- [ ] 4.2.2 Create Navigation API route (website)
- [ ] 4.2.3 Create Timeline API route (website)
- [ ] 4.2.4 Create Videos API route (website)
- [ ] 4.2.5 Create Audio API route (website)
- [ ] 4.2.6 Create Photos API route (website)
- [ ] 4.2.7 Create Form Config API route (website)
- [ ] 4.2.8 Create Memories Submit API route (website)
- [ ] 4.3 Create website hooks or Server Component data fetchers
- [ ] 4.4.1 Update AnniversaryLanding.tsx
- [ ] 4.4.2 Update AnniversaryNavigation.tsx
- [ ] 4.4.3 Update AnniversaryTimeline.tsx
- [ ] 4.4.4 Update VideoGallery.tsx
- [ ] 4.4.5 Update AudioMemories.tsx
- [ ] 4.4.6 Update PhotoCollection.tsx
- [ ] 4.4.7 Update MemorySharing.tsx
- [ ] 4.5 Implement caching strategy

---

## ⏱️ Estimated Time per Step

| Step                        | Estimated Time  |
| --------------------------- | --------------- |
| STEP 1: Backend Foundation  | 6-8 hours       |
| STEP 2: UI Structure        | 2-3 hours       |
| STEP 3: Components & Forms  | 10-12 hours     |
| STEP 4: Website Integration | 4-6 hours       |
| **Total**                   | **22-29 hours** |

---

## 🎯 Success Criteria

### **After STEP 1:**

- ✅ All API routes return correct data
- ✅ All hooks work with proper error handling
- ✅ Cloudinary uploads functional
- ✅ Test with Postman/Thunder Client

### **After STEP 2:**

- ✅ All pages visible in sidebar
- ✅ All pages load with correct layout
- ✅ Navigation works between pages
- ✅ PageShell renders properly

### **After STEP 3:**

- ✅ Can create, edit, delete all content types
- ✅ Inline editing works for singletons
- ✅ Modals work for multi-item content
- ✅ Drag-and-drop ordering functional
- ✅ Image/audio uploads work
- ✅ All forms validate properly

### **After STEP 4:**

- ✅ Website displays database content
- ✅ No hardcoded data remains
- ✅ Caching works effectively
- ✅ Page load times acceptable
- ✅ All animations still work

---

## 🚀 Ready to Start?

**Order of implementation:**

1. STEP 1 → Test APIs with Postman
2. STEP 2 → Verify all pages load
3. STEP 3 → Build components incrementally (one section at a time)
4. STEP 4 → Connect website (test each component)

**Incremental approach within STEP 3:**

- Start with Hero (simplest - singleton, inline editing)
- Then Navigation Cards (introduces modals + list)
- Then Timeline Events (similar to navigation)
- Then Photos (introduces image uploads)
- Then Videos (similar to photos)
- Then Audio (introduces audio uploads)
- Then Form Config (back to singleton)
- Finally Memories (read-only moderation)

---

**AWAITING YOUR GO TO START IMPLEMENTATION!** 🚦
