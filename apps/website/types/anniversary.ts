// Website types for Anniversary CMS (read-only)

export interface AnniversaryHero {
  hero_number: string;
  hero_subtitle: string;
  description: string | null;
  cta_text: string;
  cta_target_section: string;
  enable_intro_animation: boolean;
  skip_button_text: string;
}

export interface HeroStat {
  id: string;
  icon_name: string;
  number: string;
  label: string;
  display_order: number;
}

export interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  target_section_id: string;
  display_order: number;
}

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string | null;
  year: number | null;
  category: string;
  display_order: number;
}

export interface AudioMemory {
  id: string;
  title: string;
  description: string;
  speaker_name: string | null;
  year: number | null;
  duration: string;
  audio_url: string;
  display_order: number;
}

export interface Photo {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  category: string;
  image_url: string;
  display_order: number;
}

export interface FormConfig {
  section_title: string;
  section_description: string;
  name_label: string;
  email_label: string;
  message_label: string;
  year_label: string;
  submit_button_text: string;
  success_message: string;
  is_enabled: boolean;
}

export interface Memory {
  id: string;
  name: string;
  email: string;
  message: string;
  year: number | null;
  is_featured: boolean;
  created_at: string;
}

// Combined response types for API
export interface AnniversaryPageData {
  hero: AnniversaryHero;
  heroStats: HeroStat[];
  navigationCards: NavigationCard[];
  timelineEvents: TimelineEvent[];
  videos: Video[];
  audioMemories: AudioMemory[];
  photos: Photo[];
  formConfig: FormConfig;
  featuredMemories: Memory[];
}
