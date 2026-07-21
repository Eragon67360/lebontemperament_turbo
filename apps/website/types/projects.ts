export interface Photographer {
  name: string;
  url: string;
}

export interface ProjectImage {
  url: string;
  photographer?: Photographer;
}

export interface Author {
  name: string;
}

export interface PressArticle {
  title: string;
  url: string;
  source: string;
}

// Rich editorial concert story stored in the legacy `projects` table.
// This is distinct from a dated agenda occurrence in `concerts`.
export interface DatabaseProject {
  id: string;
  name: string;
  sub_name: string | null;
  slug: string;
  date: string;
  image: string | null; // Cloudinary path or URL
  explanation: string | null;
  banniere: string | null; // Cloudinary path
  banniere_photographer_name: string | null;
  banniere_photographer_url: string | null;
  image2: string | null; // Cloudinary path
  image2_photographer_name: string | null;
  image2_photographer_url: string | null;
  image3: string | null; // Cloudinary path
  image3_photographer_name: string | null;
  image3_photographer_url: string | null;
  text1: string | null;
  text2: string | null;
  author_name: string | null;
  press_articles: PressArticle[] | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Public concert-story model used by editorial detail pages.
export interface ConcertProject {
  id: string;
  name: string;
  subName?: string;
  explanation?: string;
  banniere?: ProjectImage;
  text1?: string;
  text2?: string;
  image2?: ProjectImage;
  image3?: ProjectImage;
  date: string;
  slug: string;
  image: string;
  author?: Author;
  press_articles?: PressArticle[];
}
