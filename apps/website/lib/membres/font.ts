import { Atkinson_Hyperlegible_Next } from "next/font/google";

/**
 * The members area's reading font (Atkinson Hyperlegible Next, made for low
 * vision readers). Applied by the members layout and by the menus that render
 * in a portal, outside that layout.
 */
export const membersFont = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: "swap",
  fallback: ["Atkinson Hyperlegible", "system-ui", "arial"],
});
