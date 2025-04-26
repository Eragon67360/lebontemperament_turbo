// types/videos.ts
export interface Video {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  composer: string;
  youtube_url: string;
  performance_date: string;
  venue: string;
  soloists: string[];
  created_by: string;
  is_active: boolean;
  display_order?: number;
}

export type VideoFormData = Omit<
  Video,
  | "id"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "is_active"
  | "display_order"
>;
