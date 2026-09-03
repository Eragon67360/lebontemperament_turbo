import { NextResponse } from "next/server";

const INDEXNOW_KEY = "b7f3e9a2c4d1486f9e0b5a7c3d2f1864";
const WEBSITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.lebontemperament.com";
const HOST = new URL(WEBSITE_URL).host;

// POST { "urls": ["https://www.lebontemperament.com/concerts", ...] }
// Submits URLs to IndexNow (Bing, Yandex, Seznam, Naver) for instant indexing.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls: unknown = body?.urls;

    if (!Array.isArray(urls) || urls.length === 0 || urls.length > 100) {
      return NextResponse.json(
        { error: "Provide 1–100 URLs in { urls: [] }" },
        { status: 400 },
      );
    }

    // Trust boundary: only submit URLs belonging to this site
    const valid = urls.every(
      (u) => typeof u === "string" && new URL(u).host === HOST,
    );
    if (!valid) {
      return NextResponse.json(
        { error: `All URLs must be on host ${HOST}` },
        { status: 400 },
      );
    }

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${WEBSITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });

    return NextResponse.json(
      { submitted: urls.length, indexNowStatus: res.status },
      { status: res.ok ? 200 : 502 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
