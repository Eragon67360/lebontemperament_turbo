"use client";

import { usePathname } from "next/navigation";

/**
 * The pathname as the browser reads it, for anything the server renders.
 *
 * On Vercel the cached home page is rendered with the pathname "/index" (the
 * name of its prerendered file), while the browser reads "/". Anything chosen
 * from it then differs between the server HTML and the hydrating render, and
 * React keeps the server's attributes: the home's header stayed solid over
 * the photo until the visitor scrolled (audit UI-V-002), and « Accueil » lost
 * its current-page border. Next.js itself reads "/index" as "/" when it
 * renders that page; this does the same for the pathname client components
 * get.
 */
export function sitePathname(pathname: string): string {
  return pathname === "/index" ? "/" : pathname;
}

/** `usePathname()`, with the home's "/index" read as "/" (`sitePathname`). */
export function useSitePathname(): string {
  return sitePathname(usePathname());
}
