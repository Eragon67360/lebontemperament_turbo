export interface ConcertProject {
  id: number;
  name: string;
  subName?: string;
  explanation?: string;
  banniere?: {
    url: string;
    photographer?: {
      name: string;
      url: string;
    };
  };
  text1?: string;
  text2?: string;
  image2?: {
    url: string;
    photographer?: {
      name: string;
      url: string;
    };
  };
  image3?: {
    url: string;
    photographer?: {
      name: string;
      url: string;
    };
  };
  date: string;
  slug: string;
  image: string;
  author?: {
    name: string;
  };
  press_articles?: Array<{
    title: string;
    url: string;
    source: string;
  }>;
}
