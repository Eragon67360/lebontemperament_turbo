"use client";

import { DensityProvider } from "@/components/DensityProvider";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AnimatePresence } from "motion/react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";

/**
 * Pages still hard-code light surfaces, so the theme is forced to light
 * everywhere until the Phase 5 dark-mode sweep. The design-system lab is the
 * one place where the switch works, to review the primitives in both themes.
 */
const THEME_SWITCHABLE_PATHS = ["/dashboard/design-system"];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const themeSwitchable = THEME_SWITCHABLE_PATHS.includes(pathname);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme={themeSwitchable ? undefined : "light"}
      disableTransitionOnChange
    >
      <DensityProvider>
        <QueryClientProvider client={queryClient}>
          <AnimatePresence mode="wait">{children}</AnimatePresence>
          {/* Inside ThemeProvider so toasts follow the app's theme. */}
          <Toaster position="top-right" richColors />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </DensityProvider>
    </ThemeProvider>
  );
}
