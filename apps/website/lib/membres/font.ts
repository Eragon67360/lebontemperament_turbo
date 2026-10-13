import { Gabarito, Hanken_Grotesk } from "next/font/google";

/**
 * The members area's reading font (« Les Pupitres »: Hanken Grotesk). Applied
 * by the members layout and by the menus that render in a portal, outside
 * that layout.
 */
export const membersFont = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

/**
 * The members area's titles (Gabarito), as the `font-members-display`
 * utility: the layout sets its variable, titles opt in with the class.
 */
export const membersDisplayFont = Gabarito({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600"],
  variable: "--font-members-display-face",
  fallback: ["system-ui", "arial"],
});

/** Every class the members area's root (and its portals) needs. */
export const membersFontClasses = `${membersFont.className} ${membersDisplayFont.variable}`;
