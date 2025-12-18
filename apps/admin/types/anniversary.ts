// ============================================================================
// Core Entity Types
// ============================================================================

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

export interface AnniversaryHeroStat {
  id: string;
  icon_name: string;
  number: string;
  label: string;
  display_order: number;
  is_visible: boolean;
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

// ============================================================================
// DTO Types (Data Transfer Objects)
// ============================================================================

export interface UpdateAnniversaryHeroDTO {
  hero_number?: string;
  hero_subtitle?: string;
  description?: string | null;
  cta_text?: string;
  cta_target_section?: string;
  enable_intro_animation?: boolean;
  skip_button_text?: string;
}

export interface CreateHeroStatDTO {
  icon_name: string;
  number: string;
  label: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateHeroStatDTO extends Partial<CreateHeroStatDTO> {
  id: string;
}

export interface CreateNavigationCardDTO {
  title: string;
  description: string;
  icon_name: string;
  target_section_id: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateNavigationCardDTO extends Partial<CreateNavigationCardDTO> {
  id: string;
}

export interface CreateTimelineEventDTO {
  year: number;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateTimelineEventDTO extends Partial<CreateTimelineEventDTO> {
  id: string;
}

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

export interface UpdateVideoDTO extends Partial<CreateVideoDTO> {
  id: string;
}

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

export interface UpdateAudioMemoryDTO extends Partial<CreateAudioMemoryDTO> {
  id: string;
}

export interface CreatePhotoDTO {
  title: string;
  description?: string | null;
  year?: number | null;
  category: string;
  image_url: string;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdatePhotoDTO extends Partial<CreatePhotoDTO> {
  id: string;
}

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
  id: string;
  is_approved?: boolean;
  is_featured?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface CloudinaryUploadResponse {
  url: string;
  secure_url: string;
  public_id: string;
}

// Icon options (predefined list for UI pickers)
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

// Category options for videos
export const VIDEO_CATEGORIES = [
  "Concert",
  "Témoignage",
  "Documentaire",
  "Tournée",
  "Éducation",
  "Autre",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

// Category options for photos
export const PHOTO_CATEGORIES = [
  "Concert",
  "Studio",
  "Tournée",
  "Répétition",
  "Événement",
  "Éducation",
  "Autre",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];
