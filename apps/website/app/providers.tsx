"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ReactNode } from "react";
import { motion } from "motion/react";
import { ThemeProvider } from "next-themes";
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AuthProvider>
          <HeroUIProvider reducedMotion="user" locale="fr-FR">
            <ThemeProvider attribute="class" defaultTheme="light">
              <ToastProvider placement="top-right" />
              {children}
            </ThemeProvider>
          </HeroUIProvider>
        </AuthProvider>
      </motion.div>
    </>
  );
}

export default Providers;
