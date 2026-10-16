// Address suggestions for the buyers of « Commandes », from the national
// address base (BAN) through IGN's Géoplateforme geocoder: free, no key,
// 50 requests a second per IP. Picking a suggestion gives the address in the
// form « 31a Rue des Vignes 67520 Wangen », which the delivery round's map
// finds. The admin calls it through /api/orders/address-search; the app has
// the same rules in Dart (lib/features/orders/domain/address_search.dart).

export const ADDRESS_SEARCH_URL = "https://data.geopf.fr/geocodage/search";
/** The service refuses shorter queries; fewer letters suggest nothing useful. */
export const ADDRESS_QUERY_MIN = 3;
export const ADDRESS_QUERY_MAX = 200;
export const ADDRESS_SUGGESTIONS_MAX = 5;

export type AddressSuggestion = {
  /** « 31a Rue des Vignes 67520 Wangen »: what goes in the field. */
  label: string;
  /** « 67, Bas-Rhin, Grand Est »: helps tell two Wangen apart. */
  context: string | null;
};

/** The query as sent, or null when it is too short or too long to search. */
export function addressQuery(input: string): string | null {
  const q = input.replace(/\s+/g, " ").trim();
  if (q.length < ADDRESS_QUERY_MIN || q.length > ADDRESS_QUERY_MAX) return null;
  // The service wants a letter or a digit first.
  if (!/^[\p{L}\p{N}]/u.test(q)) return null;
  return q;
}

export function addressSearchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    index: "address",
    autocomplete: "1",
    limit: String(ADDRESS_SUGGESTIONS_MAX),
  });
  return `${ADDRESS_SEARCH_URL}?${params}`;
}

/** The suggestions in a geocoder answer (GeoJSON), unknown shapes skipped. */
export function parseAddressSuggestions(json: unknown): AddressSuggestion[] {
  const features = (json as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) return [];
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const feature of features) {
    const p = (feature as { properties?: Record<string, unknown> } | null)
      ?.properties;
    const label = typeof p?.label === "string" ? p.label.trim() : "";
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const context =
      typeof p?.context === "string" && p.context.trim()
        ? p.context.trim()
        : null;
    out.push({ label, context });
    if (out.length === ADDRESS_SUGGESTIONS_MAX) break;
  }
  return out;
}
