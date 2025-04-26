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
  const changeFrequency: ChangeFrequency = "daily";
  const staticRoutes = [
    "",
    "/decouvrir",
    "/concerts",
    "/concerts/autres",
    "/galerie",
    "/contact",
    "/membres",
    "/impressum",
    "/politique-de-confidentialite",
  ].map((route) => ({
    url: `${WEBSITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency,
  }));

  const dynamicRoutes = projects.map((project: { slug: string }) => ({
    url: `${WEBSITE_URL}/concerts/${project.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
