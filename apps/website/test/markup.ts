// Reads server-rendered markup the way assistive technology and voice control
// do: which controls a screen reader can reach, what each is called, and
// whether its name contains the text people see (WCAG 2.5.3, Label in Name).
// A small model of the accessible name computation (accname 1.2) covering what
// the site's controls use: aria-labelledby, aria-label, image alt, SVG titles,
// text content. Used by `npm test -w website` only; no browser, no new package.

export type El = {
  tag: string;
  attrs: Record<string, string>;
  children: (El | string)[];
  parent: El | null;
};

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

const TOKEN =
  /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*"[^"]*")?)*)\s*\/?>|([^<]+)/g;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*"([^"]*)")?/g;

function decode(text: string): string {
  return text.replace(
    /&(amp|lt|gt|quot|apos|#x[0-9a-f]+|#\d+);/gi,
    (_, entity: string) => {
      const named: Record<string, string> = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
      };
      const lower = entity.toLowerCase();
      if (lower in named) return named[lower]!;
      return String.fromCodePoint(
        lower.startsWith("#x")
          ? parseInt(lower.slice(2), 16)
          : parseInt(lower.slice(1), 10),
      );
    },
  );
}

/** Parses the output of `renderToStaticMarkup` (well-formed, double-quoted). */
export function parseHtml(html: string): El {
  const root: El = { tag: "#root", attrs: {}, children: [], parent: null };
  let current = root;
  // Strip until nothing changes, so a removal can't splice a new tag together.
  let source = html;
  for (let previous = ""; previous !== source;) {
    previous = source;
    source = source.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  }
  for (const match of source.matchAll(TOKEN)) {
    const [whole, closing, tag, attributes, text] = match;
    if (text !== undefined) {
      current.children.push(decode(text));
    } else if (tag === undefined) {
      continue; // a comment
    } else if (closing) {
      let open: El | null = current;
      while (open && open.tag !== tag.toLowerCase()) open = open.parent;
      if (open?.parent) current = open.parent;
    } else {
      const el: El = {
        tag: tag.toLowerCase(),
        attrs: {},
        children: [],
        parent: current,
      };
      for (const attr of (attributes ?? "").matchAll(ATTRIBUTE)) {
        el.attrs[attr[1]!.toLowerCase()] = decode(attr[2] ?? "");
      }
      current.children.push(el);
      if (!VOID.has(el.tag) && !whole.endsWith("/>")) current = el;
    }
  }
  return root;
}

export function allElements(root: El): El[] {
  const found: El[] = [];
  const visit = (el: El) => {
    for (const child of el.children) {
      if (typeof child === "string") continue;
      found.push(child);
      visit(child);
    }
  };
  visit(root);
  return found;
}

const isRemoved = (el: El) =>
  "hidden" in el.attrs || /display\s*:\s*none/.test(el.attrs.style ?? "");
const isHiddenFromAT = (el: El) =>
  el.attrs["aria-hidden"] === "true" || isRemoved(el);

/** In the accessibility tree: no `aria-hidden`, `hidden` or `display: none` on it or above. */
export function isExposed(el: El): boolean {
  for (let node: El | null = el; node; node = node.parent) {
    if (isHiddenFromAT(node)) return false;
  }
  return true;
}

/** Reached by the Tab key: a link or button (or a `tabindex` of 0 or more), not removed. */
export function isTabbable(el: El): boolean {
  for (let node: El | null = el; node; node = node.parent) {
    if (isRemoved(node)) return false;
  }
  const tabindex = el.attrs.tabindex;
  if (tabindex !== undefined) return Number(tabindex) >= 0;
  if (el.tag === "a") return "href" in el.attrs;
  if (el.tag === "button") return !("disabled" in el.attrs);
  return false;
}

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

function textOf(node: El | string, withAlternatives: boolean): string {
  if (typeof node === "string") return node;
  if (isHiddenFromAT(node)) return "";
  if (node.tag === "img") return withAlternatives ? (node.attrs.alt ?? "") : "";
  if (node.tag === "svg") {
    const title = node.children.find(
      (child): child is El =>
        typeof child !== "string" && child.tag === "title",
    );
    return withAlternatives && title ? textOf(title, true) : "";
  }
  return node.children
    .map((child) =>
      typeof child === "string"
        ? child
        : ` ${textOf(child, withAlternatives)} `,
    )
    .join("");
}

/** The text a sighted person reads on the control (images and icons are not text). */
export function visibleText(el: El): string {
  return squash(textOf(el, false));
}

function byId(root: El, id: string): El | undefined {
  return allElements(root).find((el) => el.attrs.id === id);
}

function referenced(root: El, ids: string | undefined): string {
  return squash(
    (ids ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => {
        const target = byId(root, id);
        // A referenced element counts even when it is hidden itself.
        return target
          ? target.children.map((child) => textOf(child, true)).join(" ")
          : "";
      })
      .join(" "),
  );
}

/** What a screen reader announces first: labelledby, aria-label, then the content. */
export function accessibleName(el: El, root: El): string {
  const labelledBy = referenced(root, el.attrs["aria-labelledby"]);
  if (labelledBy) return labelledBy;
  const label = squash(el.attrs["aria-label"] ?? "");
  if (label) return label;
  if (el.tag === "img") return squash(el.attrs.alt ?? "");
  return squash(textOf(el, true)) || squash(el.attrs.title ?? "");
}

/** What it announces after the name (`aria-describedby`). */
export function accessibleDescription(el: El, root: El): string {
  return referenced(root, el.attrs["aria-describedby"]);
}

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** WCAG 2.5.3: the name contains the visible text (case, spacing and punctuation aside). */
export function nameContainsText(name: string, text: string): boolean {
  return words(name).includes(words(text));
}

export function controls(root: El): El[] {
  return allElements(root).filter(
    (el) =>
      (el.tag === "a" && "href" in el.attrs) ||
      el.tag === "button" ||
      el.attrs.role === "button" ||
      el.attrs.role === "link",
  );
}

const show = (el: El) =>
  `<${el.tag}${el.attrs.href !== undefined ? ` href="${el.attrs.href}"` : ""}>`;

/**
 * The links and buttons a screen reader can reach that have no name, or whose
 * name leaves out the text on screen (a voice-control user says what they see).
 */
export function nameProblems(root: El): string[] {
  const problems: string[] = [];
  for (const el of controls(root)) {
    if (!isExposed(el)) continue;
    const name = accessibleName(el, root);
    const text = visibleText(el);
    if (!name) {
      problems.push(`${show(el)} has no accessible name`);
    } else if (text && !nameContainsText(name, text)) {
      problems.push(
        `${show(el)} is shown as « ${text} » but named « ${name} »`,
      );
    }
  }
  return problems;
}
