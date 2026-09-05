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
