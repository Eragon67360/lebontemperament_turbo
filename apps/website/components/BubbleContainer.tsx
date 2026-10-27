"use client";

import { useSitePathname } from "@/hooks/useSitePathname";
import FeaturedVideosBubble from "./FeaturedVideosBubble";
import { SocialPopover } from "./SocialPopover";

export const BubbleContainer = () => {
  const pathname = useSitePathname();

  // Don't show on admin or full-screen track pages
  if (pathname.startsWith("/membres") || pathname.startsWith("/track"))
    return null;

  // One layer under the navigation (z-50), so the open phone menu covers the
  // bubbles instead of the bubbles covering the menu
  return (
    <div className="pointer-events-none fixed right-0 bottom-8 left-0 z-40 flex items-end justify-between px-8 md:justify-end md:gap-4">
      <SocialPopover />
      {/* Only show video bubble on home page */}
      {pathname === "/" && <FeaturedVideosBubble />}
    </div>
  );
};
