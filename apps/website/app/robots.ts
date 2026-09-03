import { MetadataRoute } from "next";
const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Never block /_next/ — crawlers need the JS/CSS bundles to render.
      disallow: ["/membres/*", "/api/*", "/download", "/auth"],
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  };
}
