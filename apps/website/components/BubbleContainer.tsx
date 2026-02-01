"use client";

import { usePathname } from "next/navigation";
import FeaturedVideosBubble from "./FeaturedVideosBubble";
import { SocialPopover } from "./SocialPopover";

export const BubbleContainer = () => {
  const pathname = usePathname();

  // Don't show on admin or full-screen track pages
  if (pathname.startsWith("/membres") || pathname.startsWith("/track"))
    return null;

  return (
    <div className="pointer-events-none fixed right-0 bottom-8 left-0 z-50 flex items-end justify-between px-8 md:justify-end md:gap-4">
      <SocialPopover />
      {/* Only show video bubble on home page */}
      {pathname === "/" && <FeaturedVideosBubble />}
    </div>
  );
};
