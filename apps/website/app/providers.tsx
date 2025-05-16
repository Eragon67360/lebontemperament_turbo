"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ReactNode } from "react";
import { motion } from "motion/react";
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
            <ToastProvider placement="top-right" />
            {children}
          </HeroUIProvider>
        </AuthProvider>
      </motion.div>
    </>
  );
}

export default Providers;
