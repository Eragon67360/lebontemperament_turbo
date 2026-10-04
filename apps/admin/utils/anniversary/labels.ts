// Plain French for the archive type enum stored in the database.
import {
  ARCHIVE_THEMES,
  ARCHIVE_TYPES,
  type ArchiveType,
} from "@/types/anniversary";

export const ARCHIVE_TYPE_LABELS: Record<ArchiveType, string> = {
  "assemblée-générale": "Assemblée générale",
  "rapport-annuel": "Rapport annuel",
  "rapport-financier": "Rapport financier",
  gazette: "Gazette",
  programme: "Programme",
  "document-historique": "Document historique",
};

export function archiveTypeLabel(type: string): string {
  return (ARCHIVE_TYPE_LABELS as Record<string, string>)[type] ?? type;
}

export const ARCHIVE_TYPE_OPTIONS = ARCHIVE_TYPES.map((value) => ({
  value,
  label: ARCHIVE_TYPE_LABELS[value],
}));

export const ARCHIVE_THEME_OPTIONS = [...ARCHIVE_THEMES, "Autre"].map(
  (value) => ({ value, label: value }),
);
