import { createAdminClient } from "@/utils/supabase/admin";
import type { Project } from "@repo/domain/types/projects";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";

export const revalidate = 3600; // regenerate at most once per hour

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  let items: string[] = [];

  try {
    const supabase = createAdminClient();
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .order("date", { ascending: false })
      .limit(20);

    if (projects) {
      items = projects.map((p: Project) => {
        const url = `${WEBSITE_URL}/concerts/${p.slug}`;
        const pubDate = new Date(p.updated_at || p.date).toUTCString();
        return `    <item>
      <title>${escapeXml(`${p.name} ${p.sub_name || ""}`.trim())}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.explanation || "")}</description>
    </item>`;
      });
    }
  } catch (error) {
    console.error("Error generating RSS feed:", error);
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Le Bon Tempérament — Concerts et actualités</title>
    <link>${WEBSITE_URL}</link>
    <description>Concerts, tournées et histoires de l'ensemble vocal et instrumental Le Bon Tempérament, à Saverne (Alsace).</description>
    <language>fr-FR</language>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
