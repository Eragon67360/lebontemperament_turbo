"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

/**
 * Providers Component
 * HeroUI v3 requires no HeroUIProvider; next-themes still drives dark mode
 * via the `class` attribute. Toast.Provider mounts the v3 toast queue.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <AuthProvider>{children}</AuthProvider>
      <Toast.Provider />
    </NextThemesProvider>
  );
}

export default Providers;
