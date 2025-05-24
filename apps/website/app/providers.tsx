'use client'
import { AuthProvider } from "@/components/providers/AuthProvider";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthProvider>
        <HeroUIProvider reducedMotion="user" locale="fr-FR">
          <ThemeProvider attribute="class" defaultTheme="light">
            <ToastProvider placement="top-right" />
            {children}
          </ThemeProvider>
        </HeroUIProvider>
      </AuthProvider>
    </>
  );
}

export default Providers;
