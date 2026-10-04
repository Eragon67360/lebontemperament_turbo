// Wording of the Drive index in the admin: sizes, types, dates, Drive links
// and the last sync. Pure, French, tested by format.test.ts.
import { driveFolderUrl } from "@repo/domain/utils/drive";
import type { DriveIndexNode } from "./tree";

const UNITS = ["octets", "Ko", "Mo", "Go", "To"] as const;
const DECIMAL = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** « 512 octets », « 1,5 Ko », « 12,3 Mo »; null when Drive gives no size (Google Docs, shortcuts). */
export function formatFileSize(
  bytes: number | null | undefined,
): string | null {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) {
    return null;
  }
  if (bytes < 0) return null;
  if (bytes < 1024) return bytes <= 1 ? `${bytes} octet` : `${bytes} octets`;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${DECIMAL.format(value)} ${UNITS[unit]}`;
}

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.google-apps.document": "Document Google",
  "application/vnd.google-apps.spreadsheet": "Feuille Google",
  "application/vnd.google-apps.presentation": "Présentation Google",
  "application/vnd.google-apps.form": "Formulaire Google",
  "application/vnd.google-apps.shortcut": "Raccourci",
  "application/vnd.google-apps.folder": "Dossier",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.ms-powerpoint": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PowerPoint",
  "application/vnd.recordare.musicxml+xml": "MusicXML",
  "application/vnd.recordare.musicxml": "MusicXML",
  "application/zip": "Archive ZIP",
  "text/plain": "Texte",
  "audio/midi": "MIDI",
  "audio/x-midi": "MIDI",
};

const EXTENSION_LABELS: Record<string, string> = {
  pdf: "PDF",
  mscz: "MuseScore",
  mscx: "MuseScore",
  musicxml: "MusicXML",
  mxl: "MusicXML",
  sib: "Sibelius",
  mid: "MIDI",
  midi: "MIDI",
  mp3: "Audio MP3",
  wav: "Audio WAV",
  m4a: "Audio M4A",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  zip: "Archive ZIP",
};

/** A short French label for a document's type, from its mime type, else its extension. */
export function fileTypeLabel(
  mimeType: string | null | undefined,
  name = "",
): string {
  if (mimeType && MIME_LABELS[mimeType]) return MIME_LABELS[mimeType];
  const extension = /\.([a-z0-9]{1,8})$/i.exec(name)?.[1]?.toLowerCase();
  if (extension && EXTENSION_LABELS[extension]) {
    return EXTENSION_LABELS[extension];
  }
  if (mimeType?.startsWith("audio/")) return "Audio";
  if (mimeType?.startsWith("video/")) return "Vidéo";
  if (mimeType?.startsWith("image/")) return "Image";
  return "Fichier";
}

const DAY = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

/** « 12 sept. 2026 » (Paris day); null without a usable date. */
export function formatModifiedDate(iso: string | null | undefined) {
  if (!iso) return null;
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : DAY.format(new Date(time));
}

/**
 * Where « Ouvrir dans Drive » points. Only people the folder is shared with
 * can open it; members go through the website instead.
 */
export function driveItemUrl(node: Pick<DriveIndexNode, "drive_id" | "kind">) {
  return node.kind === "folder"
    ? driveFolderUrl(node.drive_id)
    : `https://drive.google.com/file/d/${node.drive_id}/view`;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

/** « 3 dossiers · 24 documents »; « Vide » when there is nothing below. */
export function describeFolderContents(stats: {
  folders: number;
  documents: number;
}): string {
  const parts = [
    stats.folders > 0 ? plural(stats.folders, "dossier", "dossiers") : null,
    stats.documents > 0
      ? plural(stats.documents, "document", "documents")
      : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? parts.join(" · ") : "Vide";
}

export interface SyncRunLike {
  started_at: string;
  finished_at: string | null;
  mode: string;
  trigger: string;
  status: string;
  error: string | null;
}

export type SyncTone = "success" | "warning" | "danger" | "info";

export interface SyncStatus {
  tone: SyncTone;
  /** One short sentence about the index's freshness. */
  label: string;
  /** When the index was last written (the last successful apply), ISO; null if never. */
  appliedAt: string | null;
}

/**
 * What the page says about the index, from the runs (any order): when it was
 * last updated (the last apply that finished), and whether the latest apply
 * failed. Dry runs never change the index, so they don't count.
 */
export function syncStatus(runs: readonly SyncRunLike[]): SyncStatus {
  const applies = runs
    .filter((run) => run.mode === "apply")
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
  const lastSuccess = applies.find((run) => run.status === "success");
  const latest = applies[0];
  const appliedAt = lastSuccess?.finished_at ?? lastSuccess?.started_at ?? null;

  if (!latest) {
    return {
      tone: "info",
      label: "Aucune mise à jour de l'index depuis Drive n'est enregistrée.",
      appliedAt: null,
    };
  }
  if (latest.status === "error") {
    return {
      tone: "danger",
      label: "La dernière mise à jour de l'index a échoué.",
      appliedAt,
    };
  }
  if (latest.status === "running") {
    return {
      tone: "warning",
      label: "Une mise à jour de l'index est en cours ou a été interrompue.",
      appliedAt,
    };
  }
  return { tone: "success", label: "L'index est à jour.", appliedAt };
}
