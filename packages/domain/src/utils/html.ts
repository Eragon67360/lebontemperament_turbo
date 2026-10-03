const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes text for safe interpolation into HTML (element content or a quoted
 * attribute value). Use it on anything a visitor typed before it goes into an
 * HTML email. `null`/`undefined` become "".
 */
export const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]!);
};

/** Escapes multi-line text and keeps its line breaks as `<br>`. */
export const escapeHtmlWithBreaks = (value: unknown): string =>
  escapeHtml(value).replace(/\r?\n/g, "<br>");
