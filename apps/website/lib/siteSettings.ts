import "server-only";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { createPublicClient } from "@/utils/supabase/public";
import {
  DEFAULT_SITE_SETTINGS,
  readSiteSettings,
  type SiteSettings,
} from "@repo/domain/utils/siteSettings";
import { unstable_cache } from "next/cache";

// Server-only reader: client components get `contact` and `social_links`
// through SiteSettingsProvider, never the rest (the legal notice's phone is
// shown on /mentions-legales only).

/**
 * Reads the site settings once (cookie-less client, anon key) and keeps them
 * in the data cache for five minutes, or until the admin's save calls
 * `POST /api/revalidate` with the `site-settings` tag. While the table is
 * missing, unreadable or a row is invalid, the site shows what it showed
 * before the admin managed these (DEFAULT_SITE_SETTINGS), key by key.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) {
        console.error(
          "Site settings unavailable, showing the defaults:",
          error,
        );
        return DEFAULT_SITE_SETTINGS;
      }

      const { settings, invalid } = readSiteSettings(data ?? []);
      if (invalid.length > 0) {
        console.error(
          `Invalid site settings, showing the defaults for: ${invalid.join(", ")}`,
        );
      }
      return settings;
    } catch (error) {
      console.error("Site settings unavailable, showing the defaults:", error);
      return DEFAULT_SITE_SETTINGS;
    }
  },
  ["site-settings"],
  { tags: [CACHE_TAGS.siteSettings], revalidate: 300 },
);

/**
 * The association's public mailbox: shown on the site, receives the contact
 * forms and the invitation requests. It also takes the members' personal-data
 * requests (access, rectification, erasure, account deletion): the main
 * mailbox, by the owner's decision of 2026-10-06 (#329). The sending-only
 * address of the automatic emails is never shown as a contact.
 */
export async function getContactEmail(): Promise<string> {
  return (await getSiteSettings()).contact.email;
}
