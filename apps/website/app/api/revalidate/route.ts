import { KNOWN_CACHE_TAGS } from "@/lib/cacheTags";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * POST /api/revalidate — on-demand cache invalidation, called by the admin
 * after it changes public data (concerts, tours, events, stories, videos,
 * feature flags, gallery uploads). See `apps/admin/utils/revalidateWebsite.ts`.
 *
 * Auth: the `x-revalidate-secret` header must equal `REVALIDATE_SECRET`
 * (same value in both Vercel projects). While the variable is unset the
 * route refuses every call, so a forgotten secret can never mean "open".
 *
 * Body: `{ "paths": ["/concerts", { "path": "/concerts/[slug]", "type": "page" }],
 *          "tags": ["feature-flags"] }` — both optional, at least one needed.
 */

const MAX_ITEMS = 50;
const MAX_PATH_LENGTH = 1024;

type PathEntry = { path: string; type?: "page" | "layout" };

function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parsePaths(raw: unknown): PathEntry[] | string {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return "paths must be an array";
  if (raw.length > MAX_ITEMS) return `paths: at most ${MAX_ITEMS} entries`;

  const entries: PathEntry[] = [];
  for (const item of raw) {
    const entry: Partial<PathEntry> =
      typeof item === "string"
        ? { path: item }
        : item && typeof item === "object"
          ? (item as Partial<PathEntry>)
          : {};
    const { path, type } = entry;
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.length > MAX_PATH_LENGTH
    ) {
      return "paths: each entry needs a path starting with /";
    }
    if (type !== undefined && type !== "page" && type !== "layout") {
      return "paths: type must be page or layout";
    }
    // Next.js requires the type when the path holds a dynamic segment.
    if (path.includes("[") && !type) {
      return "paths: a route pattern (with [segment]) needs a type";
    }
    entries.push(type ? { path, type } : { path });
  }
  return entries;
}

function parseTags(raw: unknown): string[] | string {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return "tags must be an array";
  if (raw.length > MAX_ITEMS) return `tags: at most ${MAX_ITEMS} entries`;
  for (const tag of raw) {
    if (typeof tag !== "string" || !KNOWN_CACHE_TAGS.includes(tag)) {
      return `tags: unknown tag (known: ${KNOWN_CACHE_TAGS.join(", ")})`;
    }
  }
  return raw as string[];
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Revalidation is not configured" },
      { status: 503 },
    );
  }

  if (!secretMatches(request.headers.get("x-revalidate-secret"), secret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { paths?: unknown; tags?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paths = parsePaths(body.paths);
  if (typeof paths === "string") {
    return NextResponse.json({ error: paths }, { status: 400 });
  }
  const tags = parseTags(body.tags);
  if (typeof tags === "string") {
    return NextResponse.json({ error: tags }, { status: 400 });
  }
  if (paths.length === 0 && tags.length === 0) {
    return NextResponse.json(
      { error: "Nothing to revalidate: give paths and/or tags" },
      { status: 400 },
    );
  }

  // Outside a Server Action `updateTag` is unavailable; `expire: 0` makes the
  // next read a cache miss instead of serving stale data for a while.
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }
  for (const { path, type } of paths) {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  }

  return NextResponse.json({
    revalidated: true,
    paths: paths.map((p) => p.path),
    tags,
    now: Date.now(),
  });
}
