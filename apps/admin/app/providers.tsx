"use client";

import { DensityProvider } from "@/components/DensityProvider";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AnimatePresence } from "motion/react";
import { ThemeProvider } from "next-themes";

/**
 * The theme follows the device until the person picks « Clair » or « Sombre »
 * in the account menu (stored in this browser). Every surface uses tokens
 * that have a `.dark` value, so no page is forced to light any more.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
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
