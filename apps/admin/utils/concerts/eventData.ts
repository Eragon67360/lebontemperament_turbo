// After a concert is saved, asks the generate-concert-event-data edge
// function to fill its event data for Google with AI (#328), then refreshes
// the website's agenda so the new JSON-LD is served.
//
// Runs after the response (Next.js `after`): the admin never waits for the
// AI, and a failure only leaves the event data as it was (logged here and in
// the function's logs). Like /api/drive-sync, the route forwards the signed-in
// admin's session and the function re-verifies it through Supabase Auth.
import { REVALIDATE, revalidateWebsite } from "@/utils/revalidateWebsite";
import { after } from "next/server";

const FUNCTION_TIMEOUT_MS = 50_000;

export async function generateConcertEventData(
  concertId: string,
  accessToken: string,
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.warn("[concertEventData] skipped: Supabase env missing");
    return false;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-concert-event-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ concert_id: concertId }),
        signal: AbortSignal.timeout(FUNCTION_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      console.error(
        `[concertEventData] function answered ${response.status} for ${concertId}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "[concertEventData] failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Schedules the fill once the response is sent; on success, revalidates the
 * agenda a second time (the first, from the save itself, ran without it).
 */
export function generateConcertEventDataAfterResponse(
  concertId: string,
  accessToken: string | null | undefined,
): void {
  if (!accessToken) {
    console.warn("[concertEventData] skipped: no session token");
    return;
  }
  after(async () => {
    if (await generateConcertEventData(concertId, accessToken)) {
      await revalidateWebsite(REVALIDATE.agenda);
    }
  });
}
