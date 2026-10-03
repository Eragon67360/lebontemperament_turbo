import { isAnniversaryFeatureEnabled } from "@/lib/anniversary";
import { createAdminClient } from "@/utils/supabase/admin";
import { MetadataRoute } from "next";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";

// Regenerate at most once per hour instead of freezing at build time.
export const revalidate = 3600;

type ChangeFrequency =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

type StaticRoute = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

// No lastModified on static pages: we have no real content-change date, and
// a fake one (deploy time) is worse than none for crawlers.
const STATIC_ROUTES: StaticRoute[] = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/decouvrir", changeFrequency: "monthly", priority: 0.8 },
  { path: "/concerts", changeFrequency: "weekly", priority: 0.9 },
  { path: "/concerts/autres", changeFrequency: "weekly", priority: 0.7 },
  { path: "/galerie", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/rejoindre", changeFrequency: "monthly", priority: 0.8 },
  { path: "/don", changeFrequency: "monthly", priority: 0.7 },
  { path: "/impressum", changeFrequency: "yearly", priority: 0.3 },
  {
    path: "/politique-de-confidentialite",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

// Listed only while the `anniversary_40_years` flag is on (otherwise they 404).
const ANNIVERSARY_ROUTES: StaticRoute[] = [
  { path: "/40-ans", changeFrequency: "weekly", priority: 0.8 },
  { path: "/40-ans/archives", changeFrequency: "monthly", priority: 0.5 },
];

const toEntry = (route: StaticRoute): MetadataRoute.Sitemap[number] => ({
  url: `${WEBSITE_URL}${route.path}`,
  changeFrequency: route.changeFrequency,
  priority: route.priority,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = STATIC_ROUTES.map(toEntry);

  // The sitemap is prerendered at build time: when the database isn't
  // reachable (CI builds use placeholder credentials), serve the static pages
  // and let revalidation fill in the rest at runtime.
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("Sitemap: database client unavailable:", error);
    return staticRoutes;
  }

  let anniversaryRoutes: MetadataRoute.Sitemap = [];
  try {
    if (await isAnniversaryFeatureEnabled(supabase)) {
      anniversaryRoutes = ANNIVERSARY_ROUTES.map(toEntry);
    }
  } catch (error) {
    console.error("Sitemap: anniversary flag unavailable:", error);
  }

  // Fetch legacy project records used as editorial concert-story pages.
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("slug, date, updated_at");

    if (projects) {
      dynamicRoutes = projects.map((project) => {
        // Real dates only: updated_at, else the concert date, else nothing.
        const lastModified = project.updated_at
          ? new Date(project.updated_at).toISOString()
          : project.date
            ? new Date(project.date).toISOString()
            : undefined;

        return {
          url: `${WEBSITE_URL}/concerts/${project.slug}`,
          ...(lastModified ? { lastModified } : {}),
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.6,
        };
      });
    }
  } catch (error) {
    console.error("Error fetching projects for sitemap:", error);
  }

  return [...staticRoutes, ...anniversaryRoutes, ...dynamicRoutes];
}
