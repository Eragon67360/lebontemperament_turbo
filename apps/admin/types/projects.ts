export interface Photographer {
  name: string;
  url: string;
}

export interface PressArticle {
  title: string;
  url: string;
  source: string;
}

export interface Project {
  id: string;
  display_order: number;
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
  created_at: string;
  updated_at: string;
}
