import {
  APPLE_TEAM_ID,
  APP_BUNDLE_ID,
  APP_LINK_PATH_PATTERN,
} from "@/lib/app-links";

/**
 * iOS Universal Links (#593): Apple's CDN fetches this file when the app is
 * installed and lets `/l/<code>` open the app. JSON without a redirect, as
 * Apple requires; cached a few hours because it changes with releases only.
 * 404 until the team ID is filled in (`lib/app-links.ts`).
 */
export async function GET() {
  if (!APPLE_TEAM_ID) {
    return new Response(null, { status: 404 });
  }
  const body = {
    applinks: {
      details: [
        {
          appIDs: [`${APPLE_TEAM_ID}.${APP_BUNDLE_ID}`],
          components: [{ "/": APP_LINK_PATH_PATTERN }],
        },
      ],
    },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=14400",
    },
  });
}
