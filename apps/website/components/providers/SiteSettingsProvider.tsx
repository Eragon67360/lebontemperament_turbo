"use client";

import type { SiteSettings } from "@repo/domain/utils/siteSettings";
import { createContext, ReactNode, useContext } from "react";

/**
 * What client components may know of the site settings. The rest (legal
 * notice, donations, joining) is read by the pages on the server, and the
 * publisher's phone must reach /mentions-legales only (#329).
 */
export type PublicSiteSettings = Pick<SiteSettings, "contact" | "social_links">;

// No default value on purpose: the defaults (DEFAULT_SITE_SETTINGS) hold the
// whole site's text, phone included, and importing them here would ship them
// in the shared client bundle. The root layout always provides the settings
// (the defaults, while the table can't be read), see lib/siteSettings.ts.
const SiteSettingsContext = createContext<PublicSiteSettings | null>(null);

/**
 * Hands the settings read on the server (`lib/siteSettings.ts`, cached and
 * revalidated by the admin's save) to client components: the footer, the
 * social links and the mailbox of the members area.
 */
export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: PublicSiteSettings;
  children: ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): PublicSiteSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) {
    throw new Error(
      "useSiteSettings needs SiteSettingsProvider (app/providers.tsx)",
    );
  }
  return settings;
}
