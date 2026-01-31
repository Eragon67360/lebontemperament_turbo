"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

/**
 * Providers Component
 * According to HeroUI docs: https://www.heroui.com/docs/customization/dark-mode
 * - Use next-themes for Next.js theme management
 * - Set attribute="class" (required by HeroUI)
 * - Nest HeroUIProvider inside ThemeProvider
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <HeroUIProvider>
        <AuthProvider>{children}</AuthProvider>
      </HeroUIProvider>
    </NextThemesProvider>
  );
}

export default Providers;
