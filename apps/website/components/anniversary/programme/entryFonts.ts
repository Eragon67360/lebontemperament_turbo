import { Bodoni_Moda, EB_Garamond } from "next/font/google";

/**
 * The programme's faces for the 40-ans entry points (navigation, phone menu,
 * home card), which render on every page. Not preloaded: the files are only
 * fetched when an entry point is on screen, so visitors who never see one
 * (feature flag off) download nothing. Same variables as `/40-ans`, so the
 * `DISPLAY` and `TEXT` utilities of `theme.ts` apply.
 */
const display = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500"],
  display: "swap",
  preload: false,
  variable: "--font-programme-display",
});
const text = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-programme-text",
});

export const entryFontVariables = `${display.variable} ${text.variable}`;
