import { createAdminClient } from "@/utils/supabase/admin";
import { MetadataRoute } from "next";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    {
      url: `${WEBSITE_URL}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as ChangeFrequency,
      priority: 1.0,
    },
    {
      url: `${WEBSITE_URL}/decouvrir`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.8,
    },
    {
      url: `${WEBSITE_URL}/concerts`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.9,
    },
    {
      url: `${WEBSITE_URL}/concerts/autres`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.7,
    },
    {
      url: `${WEBSITE_URL}/galerie`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.6,
    },
    {
      url: `${WEBSITE_URL}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.5,
    },
    {
      url: `${WEBSITE_URL}/faq`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.7,
    },
    {
      url: `${WEBSITE_URL}/rejoindre`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.8,
    },
    {
      url: `${WEBSITE_URL}/impressum`,
      lastModified: new Date().toISOString(),
      changeFrequency: "yearly" as ChangeFrequency,
      priority: 0.3,
    },
    {
      url: `${WEBSITE_URL}/politique-de-confidentialite`,
      lastModified: new Date().toISOString(),
      changeFrequency: "yearly" as ChangeFrequency,
      priority: 0.3,
    },
  ];

  // Fetch projects from database
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    // Use admin client for sitemap generation (no cookies needed)
    const supabase = createAdminClient();
    const { data: projects } = await supabase
      .from("projects")
      .select("slug, date, updated_at");

    if (projects) {
      dynamicRoutes = projects.map(
        (project: { slug: string; date?: string; updated_at?: string }) => {
          // Use updated_at if available, otherwise use date, otherwise use current date
          const lastModified = project.updated_at
            ? new Date(project.updated_at).toISOString()
            : project.date
              ? new Date(project.date).toISOString()
              : new Date().toISOString();

          return {
            url: `${WEBSITE_URL}/concerts/${project.slug}`,
            lastModified,
            changeFrequency: "monthly" as ChangeFrequency,
            priority: 0.6,
          };
        },
      );
    }
  } catch (error) {
    console.error("Error fetching projects for sitemap:", error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
