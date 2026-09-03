"use client";

import FloatingAnniversaryButton from "@/components/anniversary/FloatingAnniversaryButton";
import { BubbleContainer } from "@/components/BubbleContainer";
import ConditionalVercelAnalytics from "@/components/cookies/ConditionalVercelAnalytics";
import { FooterClientWrapper } from "@/components/FooterClientWrapper";
import Navigation from "@/components/Navigation";
import { usePathname } from "next/navigation";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTrackPage = pathname?.startsWith("/track");

  if (isTrackPage) {
    return (
      <div className="h-dvh min-h-dvh w-full overflow-hidden">{children}</div>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-primary focus:ring-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Aller au contenu principal
      </a>
      <main
        id="main-content"
        className="flex min-h-dvh flex-col justify-center"
      >
        <Navigation />
        {children}
        <BubbleContainer />
        <FloatingAnniversaryButton />
        <ConditionalVercelAnalytics />
        <FooterClientWrapper />
      </main>
    </>
  );
}
