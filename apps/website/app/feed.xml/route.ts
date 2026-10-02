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

// Publication date of a concert story: the concert date itself when it
// exists, otherwise the record's own timestamps.
const itemDate = (p: Project): Date | null => {
  for (const raw of [p.date, p.updated_at, p.created_at]) {
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

export async function GET() {
  let items: string[] = [];
  let lastBuildDate: Date | null = null;

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
        const date = itemDate(p);
        if (date && (!lastBuildDate || date > lastBuildDate)) {
          lastBuildDate = date;
        }
        const pubDate = date
          ? `      <pubDate>${date.toUTCString()}</pubDate>\n`
          : "";
        return `    <item>
      <title>${escapeXml(`${p.name} ${p.sub_name || ""}`.trim())}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
${pubDate}      <description>${escapeXml(p.explanation || "")}</description>
    </item>`;
      });
    }
  } catch (error) {
    console.error("Error generating RSS feed:", error);
  }

  const feedUrl = `${WEBSITE_URL}/feed.xml`;
  const built = (lastBuildDate ?? new Date()).toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Le Bon Tempérament — Concerts et actualités</title>
    <link>${WEBSITE_URL}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <description>Concerts, tournées et histoires de l'ensemble vocal et instrumental Le Bon Tempérament, à Saverne (Alsace).</description>
    <language>fr-FR</language>
    <lastBuildDate>${built}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
