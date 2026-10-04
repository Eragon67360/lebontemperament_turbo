// URLs of the campaign's Cloudinary assets. The upload API returns the
// public_id, which the dialogs store as the row's *_url; a few older rows
// hold a full URL instead. Both must open from the admin.

export type CloudinaryResource = "image" | "raw";

const ABSOLUTE_URL = /^(https?:)?\/\//i;

export function isAbsoluteUrl(value: string): boolean {
  return ABSOLUTE_URL.test(value);
}

/**
 * The URL of a stored asset: the value itself when it already is a URL,
 * otherwise the Cloudinary delivery URL for its public_id. Audio and
 * documents are stored as `raw`; images as `image`, with optional
 * transformations (`c_fill,w_400,h_300`).
 */
export function cloudinaryUrl(
  value: string | null | undefined,
  resource: CloudinaryResource,
  cloudName: string | undefined,
  transformations?: string,
): string | null {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;
  if (!cloudName) return null;
  const encoded = value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const transform = transformations ? `${transformations}/` : "";
  return `https://res.cloudinary.com/${cloudName}/${resource}/upload/${transform}${encoded}`;
}

/** The file name a public_id or URL ends with, for a label. */
export function fileNameOf(value: string | null | undefined): string {
  if (!value) return "";
  const last = value.split("?")[0]!.split("/").pop() ?? "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}
