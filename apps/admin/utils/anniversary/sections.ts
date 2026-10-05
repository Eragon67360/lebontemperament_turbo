// The sections of the public 40 ans page, in page order, with the HTML ids
// the website gives them (apps/website/components/anniversary/*.tsx). A
// navigation card and the hero's button jump to one of these; the admin
// offers them by name, never as a raw id to type.
export type PageSection = {
  /** The `id` attribute of the section on lebontemperament.com/40-ans. */
  id: string;
  /** Plain name, as the campaign's navigation labels it. */
  label: string;
};

export const PAGE_SECTIONS: readonly PageSection[] = [
  { id: "anniversary-navigation", label: "Cartes de navigation" },
  { id: "timeline", label: "Chronologie" },
  { id: "videos", label: "Vidéos" },
  { id: "audio", label: "Souvenirs audio" },
  { id: "photos", label: "Photos" },
  { id: "archives", label: "Archives" },
  { id: "memories", label: "Témoignages" },
];

export const SECTION_IDS = PAGE_SECTIONS.map((section) => section.id);

export function isPageSectionId(value: unknown): value is string {
  return typeof value === "string" && SECTION_IDS.includes(value);
}

/** The section's name, or the stored id when it matches no known section. */
export function sectionLabel(id: string | null | undefined): string {
  if (!id) return "";
  return PAGE_SECTIONS.find((section) => section.id === id)?.label ?? id;
}
