import {
  ConcertProject,
  DatabaseProject,
  PressArticle,
} from "@/types/projects";

export function transformProjectForFrontend(
  dbProject: DatabaseProject,
): ConcertProject {
  // `projects` is the legacy storage name for public concert stories.
  return {
    id: dbProject.id,
    name: dbProject.name,
    subName: dbProject.sub_name || undefined,
    slug: dbProject.slug,
    date: dbProject.date,
    image: dbProject.image
      ? `https://res.cloudinary.com/dlt2j3dld/image/upload/f_auto,q_auto/v1/${dbProject.image}`
      : "",
    explanation: dbProject.explanation || undefined,
    banniere: dbProject.banniere
      ? {
          url: dbProject.banniere,
          photographer:
            dbProject.banniere_photographer_name &&
            dbProject.banniere_photographer_url
              ? {
                  name: dbProject.banniere_photographer_name,
                  url: dbProject.banniere_photographer_url,
                }
              : undefined,
        }
      : undefined,
    image2: dbProject.image2
      ? {
          url: dbProject.image2,
          photographer:
            dbProject.image2_photographer_name &&
            dbProject.image2_photographer_url
              ? {
                  name: dbProject.image2_photographer_name,
                  url: dbProject.image2_photographer_url,
                }
              : undefined,
        }
      : undefined,
    image3: dbProject.image3
      ? {
          url: dbProject.image3,
          photographer:
            dbProject.image3_photographer_name &&
            dbProject.image3_photographer_url
              ? {
                  name: dbProject.image3_photographer_name,
                  url: dbProject.image3_photographer_url,
                }
              : undefined,
        }
      : undefined,
    text1: dbProject.text1 || undefined,
    text2: dbProject.text2 || undefined,
    author: dbProject.author_name ? { name: dbProject.author_name } : undefined,
    press_articles:
      (dbProject.press_articles as PressArticle[] | null) || undefined,
  };
}
