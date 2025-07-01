import { MetadataRoute } from "next";
import projects from "@/public/json/projects.json";

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  const dynamicRoutes = projects.map((project: { slug: string }) => ({
    url: `${WEBSITE_URL}/concerts/${project.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
