/**
 * List density (direction B): « Aérées » keeps 56 px rows and 44 px controls,
 * « Compactes » tightens them to 44 / 40. The value lives on
 * `<html data-density>` so CSS variables do the work; the choice is kept in
 * localStorage. Pure helpers here so they can be unit-tested without a DOM.
 */
export const DENSITIES = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITIES)[number];

export const DEFAULT_DENSITY: Density = "comfortable";
export const DENSITY_STORAGE_KEY = "lbt-admin-density";

export function isDensity(value: unknown): value is Density {
  return (
    typeof value === "string" &&
    (DENSITIES as readonly string[]).includes(value)
  );
}

/** Anything stored that is not a known density falls back to the default. */
export function parseDensity(value: unknown): Density {
  return isDensity(value) ? value : DEFAULT_DENSITY;
}

/** The attribute value for `<html data-density>`: absent when comfortable. */
export function densityAttribute(density: Density): string | undefined {
  return density === DEFAULT_DENSITY ? undefined : density;
}
