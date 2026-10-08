import type { Database } from "@repo/domain/database.types";
import {
  type AnnouncementPlacement,
  isAnnouncementLive,
  LEGACY_DONATION_ANNOUNCEMENT_ID,
} from "@repo/domain/utils/announcements";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Announcements managed in the admin (public.site_announcements): the
 * buttons under the home page's title and the donation campaign card. Until
 * the table exists (its migration is applied by hand), the donation card
 * shows the campaign that used to be hard-coded and the home shows none.
 */

export type Announcement = {
  id: string;
  title: string;
  body: string | null;
  linkLabel: string | null;
  linkUrl: string;
  /** Paris days, YYYY-MM-DD; the browser checks them again. */
  startsOn: string | null;
  endsOn: string | null;
};

export const LEGACY_DONATION_ANNOUNCEMENT: Announcement = {
  id: LEGACY_DONATION_ANNOUNCEMENT_ID,
  title: "Nouvelle campagne de dons",
  body: "Notre nouvelle campagne est ouverte. Découvrez à quoi peut servir chaque don — avec quelques coulisses du BT.",
  linkLabel: "Découvrir",
  linkUrl: "/don",
  startsOn: null,
  endsOn: null,
};

const LEGACY: Record<AnnouncementPlacement, Announcement[]> = {
  home: [],
  donation_popover: [LEGACY_DONATION_ANNOUNCEMENT],
};

/**
 * Published announcements of one placement that haven't ended, in the
 * admin's order. Ones that start later are included: cached pages keep them
 * until the browser decides with `isAnnouncementLive`.
 */
export async function listAnnouncements(
  supabase: SupabaseClient<Database>,
  placement: AnnouncementPlacement,
): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("site_announcements")
    .select("id, title, body, link_label, link_url, starts_on, ends_on")
    .eq("placement", placement)
    .eq("status", "published")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Announcements unavailable:", error.message);
    return LEGACY[placement];
  }

  return data
    .filter((a) => isAnnouncementLive({ starts_on: null, ends_on: a.ends_on }))
    .map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      linkLabel: a.link_label,
      linkUrl: a.link_url,
      startsOn: a.starts_on,
      endsOn: a.ends_on,
    }));
}
