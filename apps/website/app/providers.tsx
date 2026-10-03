"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeatureFlagProvider } from "@/components/providers/FeatureFlagProvider";
import type { PublicFeatureFlags } from "@/lib/featureFlags";
import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

/**
 * Providers Component
 * HeroUI v3 requires no HeroUIProvider; next-themes still drives dark mode
 * via the `class` attribute. Toast.Provider mounts the v3 toast queue.
 * `featureFlags` come from the root layout (read once on the server).
 */
export function Providers({
  children,
  featureFlags,
}: {
  children: ReactNode;
  featureFlags: PublicFeatureFlags;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        <FeatureFlagProvider flags={featureFlags}>
          {children}
        </FeatureFlagProvider>
      </AuthProvider>
      <Toast.Provider />
    </NextThemesProvider>
  );
}

export default Providers;
