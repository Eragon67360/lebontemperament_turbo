// Accent folding and slugs, shared by the admin, the website and the domain
// helpers (no I/O). Unicode's NFD form does not decompose the ligatures « œ »
// and « æ », so they are expanded by hand before the combining marks are
// dropped: « Chœur » folds to « Choeur », never to « Ch-ur ». Every rule here
// gives the same result as before on text without ligatures (slug.test.ts).

/**
 * The text without accents or ligatures, case and spacing kept: « Élève du
 * chœur » → « Eleve du choeur ». A capital ligature followed by a small
 * letter becomes « Oe » / « Ae » (« Œuvre » → « Oeuvre »), otherwise
 * « OE » / « AE » (« ŒUVRE » → « OEUVRE »).
 */
export function foldAccents(value: string): string {
  return value
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/Œ(?=\p{Ll})/gu, "Oe")
    .replace(/Æ(?=\p{Ll})/gu, "Ae")
    .replace(/Œ/g, "OE")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * ASCII words joined by « - », case kept: accents and ligatures folded, every
 * other run of characters is one dash, none at either end. « Compte rendu
 * AG 2025 » → « Compte-rendu-AG-2025 »; "" when nothing is a letter or digit.
 */
export function asciiWords(value: string): string {
  return foldAccents(value)
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A URL slug: « Concert de Noël 2024 ! » → « concert-de-noel-2024 ». Lower
 * case, accents and ligatures folded, dashes between words. With `maxLength`
 * the slug is cut there and never ends with a dash. "" when nothing is a
 * letter or digit, so callers can refuse or fall back.
 */
export function slugify(value: string, maxLength?: number): string {
  const slug = asciiWords(value.toLowerCase());
  return maxLength === undefined
    ? slug
    : slug.slice(0, maxLength).replace(/-+$/, "");
}
