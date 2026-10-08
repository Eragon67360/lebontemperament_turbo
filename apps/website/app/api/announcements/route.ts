import { listAnnouncements } from "@/lib/announcements";
import { createPublicClient } from "@/utils/supabase/public";
import { NextResponse } from "next/server";

// Same for every visitor (anon key): prerendered, refreshed every five
// minutes or when the admin saves an announcement (/api/revalidate).
export const revalidate = 300;

/**
 * GET /api/announcements — the published announcements that haven't ended,
 * by placement: `{ home: [...], donation_popover: [...] }`, each
 * `{ id, title, body, linkLabel, linkUrl, startsOn, endsOn }`. The donation
 * card in the navigation reads it in the browser.
 */
export async function GET() {
  const supabase = createPublicClient();
  const [home, donationPopover] = await Promise.all([
    listAnnouncements(supabase, "home"),
    listAnnouncements(supabase, "donation_popover"),
  ]);
  return NextResponse.json({ home, donation_popover: donationPopover });
}
