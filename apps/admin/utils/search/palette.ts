// The search behind the ⌘K palette (`components/shell/CommandPalette.tsx`):
// accent- and case-insensitive matching, pure and unit-tested. The palette
// filters here instead of in cmdk so « Therese » finds « Thérèse » and the
// order of the results is ours.

/** « Thérèse  MARTIN » → « therese martin »: lower case, no accents, single spaces. */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Every word of `query` appears somewhere in `fields` (in any order). */
export function matchesSearch(
  fields: ReadonlyArray<string | null | undefined>,
  query: string,
): boolean {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSearch(fields.filter(Boolean).join(" "));
  return words.every((word) => haystack.includes(word));
}

/**
 * The items matching `query`, best first: a label that starts with the query,
 * then one that contains it, then a match in the other fields. Items keep
 * their order within a rank. An empty query keeps everything, in order.
 */
export function searchItems<T>(
  items: readonly T[],
  query: string,
  fieldsOf: (item: T) => {
    label: string;
    extra?: ReadonlyArray<string | null | undefined>;
  },
  limit = Infinity,
): T[] {
  const needle = normalizeSearch(query);
  const ranked: { item: T; rank: number; index: number }[] = [];
  items.forEach((item, index) => {
    const { label, extra = [] } = fieldsOf(item);
    if (!matchesSearch([label, ...extra], query)) return;
    const normalizedLabel = normalizeSearch(label);
    const rank = !needle
      ? 0
      : normalizedLabel.startsWith(needle)
        ? 0
        : normalizedLabel.includes(needle)
          ? 1
          : 2;
    ranked.push({ item, rank, index });
  });
  ranked.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return ranked.slice(0, limit).map((entry) => entry.item);
}

export type PalettePage = {
  href: string;
  label: string;
  /** The section it belongs to (« Membres et accès »); empty for Accueil. */
  section: string;
  /** What the section is for, searched but not shown. */
  hint: string;
};

/** Every page of the menu as a palette entry, in menu order. */
export function palettePages(
  sections: ReadonlyArray<{
    label: string;
    description: string;
    href?: string;
    groups: ReadonlyArray<{
      items: ReadonlyArray<{ href: string; label: string }>;
    }>;
  }>,
): PalettePage[] {
  return sections.flatMap((section) => [
    ...(section.href
      ? [
          {
            href: section.href,
            label: section.label,
            section: "",
            hint: section.description,
          },
        ]
      : []),
    ...section.groups.flatMap((group) =>
      group.items.map((item) => ({
        href: item.href,
        label: item.label,
        section: section.label,
        hint: section.description,
      })),
    ),
  ]);
}
