"use client";

import { BubbleContainer } from "@/components/BubbleContainer";
import ConditionalVercelAnalytics from "@/components/cookies/ConditionalVercelAnalytics";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { OverPhotoHeaderProvider } from "@/components/navigation/OverPhotoHeader";
import { usePathname } from "next/navigation";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTrackPage = pathname?.startsWith("/track");
  // `/l/<code>` is the delivery link of the SMS (#593): the same tracking
  // view as `/track`, without the site's navigation and footer. It may stack
  // a card above the delivery, so it scrolls instead of clipping.
  const isDeliveryLinkPage = pathname?.startsWith("/l/");

  if (isTrackPage) {
    return (
      <div className="h-dvh min-h-dvh w-full overflow-hidden">{children}</div>
    );
  }

  if (isDeliveryLinkPage) {
    return <div className="min-h-dvh w-full">{children}</div>;
  }

  // Landmarks at the top level: navigation and footer are siblings of <main>,
  // not children. The outer column keeps the former <main> layout (min-h-dvh,
  // centred) so nothing moves; <main> is itself a flex column so the pages
  // stay flex items exactly as before. The provider lets a page's hero tell
  // the navigation that it draws over a dark photo; the home's photo is
  // certain, so its server HTML already starts over it.
  return (
    <OverPhotoHeaderProvider assumeOverPhoto={pathname === "/"}>
      <a
        href="#main-content"
        className="focus:bg-primary-solid focus:ring-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Aller au contenu principal
      </a>
      <div className="flex min-h-dvh flex-col justify-center">
        <Navigation />
        <main id="main-content" className="flex flex-col">
          {children}
        </main>
        <BubbleContainer />
        <ConditionalVercelAnalytics />
        <Footer />
      </div>
    </OverPhotoHeaderProvider>
  );
}
