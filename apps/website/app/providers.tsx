"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthProvider>
        <HeroUIProvider reducedMotion="always" locale="fr-FR">
          <ToastProvider placement="top-right" />
          {children}
          <ProgressBar
            height="4px"
            color="#18858b"
            options={{ showSpinner: false }}
            shallowRouting
          />
        </HeroUIProvider>
      </AuthProvider>
    </>
  );
}

export default Providers;
