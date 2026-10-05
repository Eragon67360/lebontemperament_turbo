/**
 * The look of the /40-ans programme (direction D, « Le Programme »): Bodoni
 * Moda for display and EB Garamond for reading, loaded by
 * `app/40-ans/page.tsx` for this page only, on the site's teal. The paper
 * tones are page tokens set by `PROGRAMME_ROOT`, with a dark variant.
 */
// Bodoni Moda follows the font size on its optical axis by default, and at
// display sizes its hairlines vanish (the bar of a « 4 », a dash, a « + »):
// the default optical size keeps them sturdy.
export const DISPLAY =
  "font-(family-name:--font-programme-display) [font-optical-sizing:none]";
export const TEXT = "font-(family-name:--font-programme-text)";

/** Small spaced capitals, in the site's Roboto. */
export const CAPS = "text-[11.5px] font-medium tracking-[0.28em] uppercase";

export const PROGRAMME_ROOT = [
  "[--p-ivory:#F4EFE4] [--p-paper:#FBF8F1] [--p-ink:#1d1f1f] [--p-muted:#5e6462] [--p-rule:#cfc6b4] [--p-teal:#156c71] [--p-deep:#0D3B3E]",
  "dark:[--p-ivory:#0d1616] dark:[--p-paper:#132121] dark:[--p-ink:#ecedee] dark:[--p-muted:#a7b2b1] dark:[--p-rule:#2c3d3d] dark:[--p-teal:#26a5ad] dark:[--p-deep:#082a2c]",
  "bg-(--p-ivory) text-(--p-ink)",
].join(" ");

/** A page of the booklet: paper on the ivory, a hairline and a soft shadow. */
export const PAPER =
  "bg-(--p-paper) shadow-[0_1px_0_var(--p-rule),0_30px_60px_-40px_rgba(13,59,62,0.35)]";

/** Ivory pill on the deep teal (cover, ticket). */
export const BUTTON_IVORY =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#F4EFE4] px-6 text-[15px] font-medium text-[#0D3B3E] transition-colors hover:bg-white";
/** Outlined pill in the current colour. */
export const BUTTON_LINE =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full border border-current px-6 text-[15px] font-medium transition-colors hover:bg-white/10";
/** Solid teal pill with white text (#337 contrast alias). */
export const BUTTON_TEAL =
  "bg-primary-solid hover:bg-primary-solid-hover inline-flex min-h-12 items-center gap-2.5 rounded-full px-6 text-[15px] font-medium text-white transition-colors";
