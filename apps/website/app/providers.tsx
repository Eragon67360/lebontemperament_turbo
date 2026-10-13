"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeatureFlagProvider } from "@/components/providers/FeatureFlagProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import {
  SiteSettingsProvider,
  type PublicSiteSettings,
} from "@/components/providers/SiteSettingsProvider";
import type { PublicFeatureFlags } from "@/lib/featureFlagKeys";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import dynamic from "next/dynamic";
import { ReactNode } from "react";

// HeroUI's toast queue outlet and sonner's Toaster, fetched after hydration
// (they render nothing until a toast exists).
const ToastProviders = dynamic(
  () => import("@/components/providers/ToastProviders"),
  { ssr: false },
);

/**
 * Providers Component
 * HeroUI v3 requires no HeroUIProvider; next-themes still drives dark mode
 * via the `class` attribute. ToastProviders mounts the v3 toast queue outlet
 * and sonner's. `featureFlags` and `siteSettings` (the public part: contact
 * and social links) come from the root layout (read once on the server).
 * MotionProvider supplies the animation features of the `m.*` components.
 */
export function Providers({
  children,
  featureFlags,
  siteSettings,
}: {
  children: ReactNode;
  featureFlags: PublicFeatureFlags;
  siteSettings: PublicSiteSettings;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        <FeatureFlagProvider flags={featureFlags}>
          <SiteSettingsProvider settings={siteSettings}>
            <MotionProvider>{children}</MotionProvider>
          </SiteSettingsProvider>
        </FeatureFlagProvider>
      </AuthProvider>
      <ToastProviders />
    </NextThemesProvider>
  );
}

export default Providers;
