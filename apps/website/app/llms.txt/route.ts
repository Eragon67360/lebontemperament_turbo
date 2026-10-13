import { buildLlmsTxt } from "@/lib/llms";
import { getSiteSettings } from "@/lib/siteSettings";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";

// Built from the site settings (admin): prerendered, refreshed every five
// minutes or when an admin saves (/api/revalidate).
export const revalidate = 300;

export async function GET() {
  return new Response(buildLlmsTxt(WEBSITE_URL, await getSiteSettings()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
