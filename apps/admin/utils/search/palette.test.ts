import { buildNavSections } from "@/lib/navigation";
import assert from "node:assert/strict";
import {
  isSearchShortcut,
  matchesSearch,
  normalizeSearch,
  palettePages,
  searchItems,
} from "./palette";

// --- Accents, case and spaces never get in the way ---
assert.equal(normalizeSearch("  Thérèse   MARTIN "), "therese martin");
assert.equal(normalizeSearch("Chœur"), "chœur");
assert.ok(matchesSearch(["Thérèse Martin"], "therese"));
assert.ok(matchesSearch(["Thérèse Martin"], "MARTIN thé"));
assert.ok(!matchesSearch(["Thérèse Martin"], "paul"));
assert.ok(matchesSearch(["a"], "   "), "an empty query matches everything");

// --- Prefix of the label first, then contains, then the other fields ---
{
  const items = [
    { label: "Comptes rendus du CA", extra: ["conseil"] },
    { label: "Concerts et tournées", extra: [] },
    { label: "Membres", extra: ["concerts"] },
    { label: "Répétitions", extra: [] },
  ];
  const fieldsOf = (item: (typeof items)[number]) => item;
  assert.deepEqual(
    searchItems(items, "conc", fieldsOf).map((i) => i.label),
    ["Concerts et tournées", "Membres"],
  );
  assert.deepEqual(
    searchItems(items, "rend", fieldsOf).map((i) => i.label),
    ["Comptes rendus du CA"],
  );
  assert.deepEqual(
    searchItems(items, "", fieldsOf).map((i) => i.label),
    items.map((i) => i.label),
  );
  assert.equal(searchItems(items, "", fieldsOf, 2).length, 2);
  assert.deepEqual(searchItems(items, "zzz", fieldsOf), []);
}

// --- Every menu page is searchable, Accueil included ---
{
  const sections = buildNavSections({ isSuperAdmin: true });
  const pages = palettePages(sections);
  assert.ok(pages.some((p) => p.label === "Accueil" && p.section === ""));
  assert.ok(pages.some((p) => p.label === "Signalements"));
  const hrefs = pages.map((p) => p.href);
  assert.equal(new Set(hrefs).size, hrefs.length, "no page twice");
  const found = searchItems(pages, "repetition", (p) => ({
    label: p.label,
    extra: [p.section, p.hint],
  }));
  assert.equal(found[0]?.label, "Répétitions");
}

// --- ⌘K or Ctrl+K, from a field too; not with Alt or Shift, not another key ---
{
  const press = (
    key: string,
    held: Partial<
      Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>
    > = {},
  ) => ({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...held,
  });
  assert.ok(isSearchShortcut(press("k", { metaKey: true })));
  assert.ok(isSearchShortcut(press("K", { ctrlKey: true })));
  assert.ok(!isSearchShortcut(press("k")));
  assert.ok(!isSearchShortcut(press("j", { metaKey: true })));
  assert.ok(!isSearchShortcut(press("k", { metaKey: true, shiftKey: true })));
  assert.ok(!isSearchShortcut(press("k", { ctrlKey: true, altKey: true })));
}

console.log("palette.test.ts ok");
