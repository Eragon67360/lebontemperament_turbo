// What the uploaders tell the admin, derived from the server's rules so the
// hint can never promise a type the API refuses (the old hints advertised
// SVG and left out AVIF, M4A…).
import { MB, type UploadRule } from "@/utils/uploads";

const EXTENSION_LABELS: Record<string, string> = {
  jpg: "JPG",
  png: "PNG",
  webp: "WebP",
  gif: "GIF",
  avif: "AVIF",
  mp3: "MP3",
  m4a: "M4A",
  aac: "AAC",
  wav: "WAV",
  ogg: "OGG",
  webm: "WebM",
  flac: "FLAC",
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
};

/** The distinct extensions a rule accepts, in the rule's order. */
export function extensionsOf(rule: UploadRule): string[] {
  return [...new Set(Object.values(rule.types))];
}

/** "JPG, PNG, WebP, GIF ou AVIF, 10 Mo maximum". */
export function uploadHint(rule: UploadRule): string {
  const labels = extensionsOf(rule).map(
    (extension) => EXTENSION_LABELS[extension] ?? extension.toUpperCase(),
  );
  const list =
    labels.length > 1
      ? `${labels.slice(0, -1).join(", ")} ou ${labels.at(-1)}`
      : (labels[0] ?? "");
  return `${list}, ${Math.round(rule.maxBytes / MB)} Mo maximum`;
}

/** The `accept` attribute of the file input: the MIME types plus the extensions. */
export function acceptFor(rule: UploadRule): string {
  return [
    ...Object.keys(rule.types),
    ...extensionsOf(rule).map((extension) => `.${extension}`),
  ].join(",");
}

/** "1,2 Mo" for a size in bytes, as the archive rows show it. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / MB).toFixed(1).replace(".", ",")} Mo`;
}
