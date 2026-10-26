/**
 * Helpers for serving Drive files through the website's proxy
 * (`/api/drive/file`) and listing folders completely (`/api/drive/files`).
 */

const GOOGLE_APPS_PREFIX = "application/vnd.google-apps.";

/** Google-native types Drive can export, and the PDF they become. */
const PDF_EXPORTABLE = new Set([
  `${GOOGLE_APPS_PREFIX}document`,
  `${GOOGLE_APPS_PREFIX}spreadsheet`,
  `${GOOGLE_APPS_PREFIX}presentation`,
  `${GOOGLE_APPS_PREFIX}drawing`,
]);

/**
 * How the proxy must fetch a file's bytes from Drive:
 * - `media`: a regular upload, read with `alt=media`;
 * - `export`: a Google Doc, Sheet, Slides or Drawing, exported as PDF;
 * - `unsupported`: a folder, a Form, a shortcut… nothing to download (415).
 */
export type DriveDownloadPlan =
  | { kind: "media"; mimeType: string }
  | { kind: "export"; mimeType: "application/pdf"; extension: ".pdf" }
  | { kind: "unsupported" };

export const driveDownloadPlan = (
  mimeType: string | null | undefined,
): DriveDownloadPlan => {
  const type = mimeType || "application/octet-stream";
  if (PDF_EXPORTABLE.has(type)) {
    return { kind: "export", mimeType: "application/pdf", extension: ".pdf" };
  }
  if (type.startsWith(GOOGLE_APPS_PREFIX)) {
    return { kind: "unsupported" };
  }
  return { kind: "media", mimeType: type };
};

/**
 * Whether the browser can show the file in a tab instead of saving it: PDFs,
 * and the Google Docs, Sheets, Slides and Drawings the proxy exports as PDF.
 */
export const isDrivePreviewable = (
  mimeType: string | null | undefined,
): boolean =>
  mimeType === "application/pdf" || PDF_EXPORTABLE.has(mimeType ?? "");

/** The name the member saves: exported files gain the export's extension. */
export const driveDownloadName = (
  name: string | null | undefined,
  plan: DriveDownloadPlan,
): string => {
  const base = (name ?? "").trim() || "fichier";
  if (plan.kind !== "export") return base;
  return base.toLowerCase().endsWith(plan.extension)
    ? base
    : `${base}${plan.extension}`;
};

/**
 * Longest file name kept in a Content-Disposition, in UTF-8 bytes (the usual
 * file-system limit; it also bounds the header at well under 1 kB).
 */
export const CONTENT_DISPOSITION_MAX_BYTES = 255;

const EXTENSION = /(\.[A-Za-z0-9]{1,15})$/;

const utf8Length = (value: string): number =>
  new TextEncoder().encode(value).length;

/** Shortens a name to `maxBytes` of UTF-8, keeping a short extension. */
const truncateName = (name: string, maxBytes: number): string => {
  if (utf8Length(name) <= maxBytes) return name;
  const ext = name.match(EXTENSION)?.[1] ?? "";
  const stem = Array.from(ext ? name.slice(0, -ext.length) : name);
  while (stem.length > 1 && utf8Length(stem.join("") + ext) > maxBytes) {
    stem.pop();
  }
  return stem.join("") + ext;
};

/**
 * ASCII fallback for the `filename=` parameter: accents stripped, quotes,
 * backslashes, control and non-ASCII characters replaced by `_`.
 */
const LIGATURES: Record<string, string> = {
  œ: "oe",
  Œ: "OE",
  æ: "ae",
  Æ: "AE",
  ß: "ss",
  ø: "o",
  Ø: "O",
};

export const asciiFileName = (name: string): string => {
  const ascii = name
    .replace(/[œŒæÆßøØ]/g, (c) => LIGATURES[c] ?? c)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]|["\\]/g, "_")
    .trim();
  return ascii || "fichier";
};

/** RFC 8187 `ext-value`: percent-encode everything outside `attr-char`. */
const encodeExtValue = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

/**
 * Builds a `Content-Disposition` value that every browser saves under the
 * file's real name: an ASCII `filename=` for old clients and an RFC 8187
 * `filename*=` carrying the UTF-8 name (accents, quotes…). Line breaks never
 * reach the header, and both names are capped so the header stays small.
 */
export const contentDisposition = (
  fileName: string,
  disposition: "attachment" | "inline" = "attachment",
): string => {
  const clean = truncateName(
    (fileName ?? "").replace(/[\r\n\0]/g, "").trim() || "fichier",
    CONTENT_DISPOSITION_MAX_BYTES,
  );
  const fallback = asciiFileName(clean);
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeExtValue(clean)}`;
};

/** The types the proxy shows in the browser; none of them runs script. */
const INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/**
 * Types a page could run as a script or apply as a stylesheet by pointing a
 * `<script>` or a `<link>` at the proxy (`nosniff` refuses every other type
 * there): never sent under their own type.
 */
const SCRIPT_OR_STYLE_TYPE =
  /^(?:(?:text|application)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript|css))$/;

/** A bare `type/subtype` (RFC 6838 names). */
const MEDIA_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;

/** `Image/PNG; x=1` → `image/png`; "" for anything that isn't a media type. */
const mediaTypeEssence = (value: string): string => {
  const essence = (value ?? "").split(";")[0]!.trim().toLowerCase();
  return MEDIA_TYPE.test(essence) ? essence : "";
};

const isMediaType = (type: string): boolean =>
  type.startsWith("audio/") || type.startsWith("video/");

const isInlineType = (type: string): boolean =>
  INLINE_TYPES.has(type) || isMediaType(type);

/**
 * The policy on every answer of the proxy but a PDF, audio or video: the
 * document loads nothing, runs nothing and gets an opaque origin, whatever
 * its bytes are; only inline styles apply (the browser's own image viewer,
 * the error page). PDFs go without a policy: the browsers' PDF viewers may
 * not run under `sandbox`.
 */
export const DRIVE_FILE_SANDBOX_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; sandbox";

/**
 * Audio and video: the browser's own player fetches the file again from its
 * document, with the member's session, so that document keeps the site's
 * origin and may load media from it. Nothing runs there either.
 */
export const DRIVE_MEDIA_SANDBOX_CSP =
  "default-src 'none'; media-src 'self'; style-src 'unsafe-inline'; sandbox allow-same-origin";

/** The headers that type a file served by `/api/drive/file`. */
export type DriveFileHeaders = {
  "Content-Type": string;
  "Content-Disposition": string;
  "X-Content-Type-Options": "nosniff";
  "Content-Security-Policy"?: string;
};

/**
 * How the proxy serves a file of type `mimeType` (the plan's type: a Google
 * Doc is already `application/pdf`) under the name `fileName`:
 * - PDFs, PNG, JPEG, GIF and WebP images, audio and video open in the
 *   browser (`inline`) under their own type;
 * - anything else is an attachment typed `application/octet-stream`, so the
 *   browser saves it and never renders it;
 * - with `download`, every file is an attachment and keeps its own type (the
 *   app hands it to the share sheet, which offers the apps that open it),
 *   except script and stylesheet types;
 * - every answer but a PDF carries a sandbox policy in which nothing runs
 *   (`DRIVE_MEDIA_SANDBOX_CSP` for audio and video, `DRIVE_FILE_SANDBOX_CSP`
 *   otherwise), and all carry `nosniff`.
 */
export const driveFileHeaders = (
  mimeType: string,
  fileName: string,
  download: boolean,
): DriveFileHeaders => {
  const type = mediaTypeEssence(mimeType);
  const inline = !download && isInlineType(type);
  const keepsType =
    inline || (download && type !== "" && !SCRIPT_OR_STYLE_TYPE.test(type));
  const contentType = keepsType ? type : "application/octet-stream";

  const headers: DriveFileHeaders = {
    "Content-Type": contentType,
    "Content-Disposition": contentDisposition(
      fileName,
      inline ? "inline" : "attachment",
    ),
    "X-Content-Type-Options": "nosniff",
  };
  if (contentType !== "application/pdf") {
    headers["Content-Security-Policy"] = isMediaType(contentType)
      ? DRIVE_MEDIA_SANDBOX_CSP
      : DRIVE_FILE_SANDBOX_CSP;
  }
  return headers;
};

/** One page of a Drive `files.list` answer (only what the loop needs). */
export type DrivePage<T> = {
  files?: T[] | null;
  nextPageToken?: string | null;
};

/** Default cap on the items one folder listing returns. */
export const DRIVE_LIST_MAX_ITEMS = 1000;

/**
 * Follows `nextPageToken` until the folder is exhausted or `maxItems` is
 * reached. `truncated` tells the caller the folder holds more than it got.
 * A repeated or empty token stops the loop, so a misbehaving API can't spin
 * it forever.
 */
export const listAllDrivePages = async <T>(
  fetchPage: (pageToken: string | undefined) => Promise<DrivePage<T>>,
  maxItems: number = DRIVE_LIST_MAX_ITEMS,
): Promise<{ items: T[]; truncated: boolean }> => {
  const items: T[] = [];
  const seenTokens = new Set<string>();
  let pageToken: string | undefined;

  for (;;) {
    const page = await fetchPage(pageToken);
    for (const file of page.files ?? []) {
      if (items.length >= maxItems) {
        return { items, truncated: true };
      }
      items.push(file);
    }

    const next = page.nextPageToken || undefined;
    if (!next || seenTokens.has(next)) {
      return { items, truncated: false };
    }
    if (items.length >= maxItems) {
      return { items, truncated: true };
    }
    seenTokens.add(next);
    pageToken = next;
  }
};
