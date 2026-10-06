import { buildLlmsTxt } from "@/lib/llms";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";

// Built from constants only: prerendered once at build time.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(WEBSITE_URL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
