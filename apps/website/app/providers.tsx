"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeatureFlagProvider } from "@/components/providers/FeatureFlagProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
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
 * and sonner's. `featureFlags` come from the root layout (read once on the
 * server). MotionProvider supplies the animation features of the `m.*`
 * components.
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
          <MotionProvider>{children}</MotionProvider>
        </FeatureFlagProvider>
      </AuthProvider>
      <ToastProviders />
    </NextThemesProvider>
  );
}

export default Providers;
