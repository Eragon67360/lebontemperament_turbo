import assert from "node:assert/strict";
import {
  ancestry,
  buildDriveTree,
  compareNodes,
  documentsByFolder,
  folderStats,
  isBelow,
  isLegacyProgramId,
  rootSections,
  type DriveIndexNode,
} from "./tree";

const node = (
  drive_id: string,
  parent_drive_id: string | null,
  name: string,
  kind: "folder" | "file" = "folder",
  extra: Partial<DriveIndexNode> = {},
): DriveIndexNode => ({
  drive_id,
  parent_drive_id,
  root_slug: "adultes",
  kind,
  name,
  mime_type:
    kind === "folder"
      ? "application/vnd.google-apps.folder"
      : "application/pdf",
  size: kind === "file" ? 1000 : null,
  modified_time: null,
  depth: 0,
  ...extra,
});

// Adultes ─ Programme 10 ─ Sopranes ─ Audio ─ a.mp3
//        │              │          └ s.pdf
//        │              └ notes.pdf
//        ├ Programme 2 (empty)
//        └ planning.pdf
// Racine ─ divers.pdf
// (orphan: parent not in the index)
const nodes: DriveIndexNode[] = [
  node("root-a", null, "Adultes", "folder", { depth: 0 }),
  node("p10", "root-a", "Programme 10", "folder", { depth: 1 }),
  node("p2", "root-a", "Programme 2", "folder", { depth: 1 }),
  node("plan", "root-a", "planning.pdf", "file", { depth: 1 }),
  node("sop", "p10", "Sopranes", "folder", { depth: 2 }),
  node("notes", "p10", "notes.pdf", "file", {
    depth: 2,
    modified_time: "2026-09-01T10:00:00Z",
  }),
  node("audio", "sop", "Audio", "folder", { depth: 3 }),
  node("s", "sop", "s.pdf", "file", {
    depth: 3,
    modified_time: "2026-09-20T10:00:00Z",
  }),
  node("a", "audio", "a.mp3", "file", { depth: 4, mime_type: "audio/mpeg" }),
  node("root-r", null, "LBT", "folder", { depth: 0, root_slug: "racine" }),
  node("div", "root-r", "divers.pdf", "file", {
    depth: 1,
    root_slug: "racine",
  }),
  node("orphan", "gone", "orphelin.pdf", "file", { depth: 2 }),
];

const tree = buildDriveTree(nodes);

// --- Sorting: folders first, numbers in order, accents ignored ---
assert.ok(
  compareNodes(
    node("x", null, "Programme 2"),
    node("y", null, "Programme 10"),
  ) < 0,
);
assert.ok(
  compareNodes(node("x", null, "zèbre"), node("y", null, "a.pdf", "file")) < 0,
);
assert.ok(
  compareNodes(
    node("x", null, "Été", "file"),
    node("y", null, "ete2", "file"),
  ) < 0,
);
assert.deepEqual(
  tree.children.get("root-a")!.map((n) => n.drive_id),
  ["p2", "p10", "plan"],
);

// --- Roots: only depth-0 nodes without a parent; orphans are dropped ---
assert.deepEqual(tree.roots.map((n) => n.drive_id).sort(), [
  "root-a",
  "root-r",
]);
// The orphan is indexed but hangs under no indexed folder.
assert.ok(tree.byId.has("orphan"));
assert.deepEqual(
  ancestry(tree, "orphan").map((n) => n.drive_id),
  ["orphan"],
);

// --- Sections: drive_folders order and labels, racine last, programmes vs loose files ---
{
  const sections = rootSections(tree, [
    { slug: "racine", label: "Drive complet", display_order: 0 },
    { slug: "adultes", label: "Adultes (chœur)", display_order: 1 },
  ]);
  assert.deepEqual(
    sections.map((s) => s.label),
    ["Adultes (chœur)", "Drive complet"],
  );
  assert.deepEqual(
    sections[0]!.programmes.map((n) => n.name),
    ["Programme 2", "Programme 10"],
  );
  assert.deepEqual(
    sections[0]!.documents.map((n) => n.name),
    ["planning.pdf"],
  );
  assert.deepEqual(sections[1]!.programmes, []);
  // Without drive_folders rows, the folder's own name is the label.
  assert.equal(rootSections(tree)[0]!.label, "Adultes");
}

// --- Stats count the whole subtree and keep the latest file date ---
assert.deepEqual(folderStats(tree, "p10"), {
  folders: 2,
  documents: 3,
  lastModified: "2026-09-20T10:00:00Z",
});
assert.deepEqual(folderStats(tree, "p2"), {
  folders: 0,
  documents: 0,
  lastModified: null,
});
assert.deepEqual(folderStats(tree, "unknown"), {
  folders: 0,
  documents: 0,
  lastModified: null,
});

// --- Ancestry and containment ---
assert.deepEqual(
  ancestry(tree, "a").map((n) => n.drive_id),
  ["root-a", "p10", "sop", "audio", "a"],
);
assert.deepEqual(ancestry(tree, "nope"), []);
assert.equal(isBelow(tree, "p10", "sop"), true);
assert.equal(isBelow(tree, "p10", "a"), true);
assert.equal(isBelow(tree, "p10", "p10"), false);
assert.equal(isBelow(tree, "p2", "sop"), false);

// A parent loop (impossible in Drive) must not hang.
{
  const loop = buildDriveTree([
    node("l1", "l2", "Boucle 1", "folder", { depth: 1 }),
    node("l2", "l1", "Boucle 2", "folder", { depth: 1 }),
  ]);
  assert.equal(ancestry(loop, "l1").length, 2);
  assert.deepEqual(folderStats(loop, "l1").folders, 1);
  assert.equal(documentsByFolder(loop, "l1").length, 0);
}

// --- Documents of a group, folder by folder ---
{
  const groups = documentsByFolder(tree, "sop");
  assert.deepEqual(
    groups.map((g) => [g.trail.join(" / "), g.documents.map((d) => d.name)]),
    [
      ["", ["s.pdf"]],
      ["Audio", ["a.mp3"]],
    ],
  );
  // Empty sub-folders are left out; the programme shows its own files first.
  assert.deepEqual(
    documentsByFolder(tree, "p10").map((g) => g.trail.join(" / ")),
    ["", "Sopranes", "Sopranes / Audio"],
  );
  assert.deepEqual(documentsByFolder(tree, "missing"), []);
}

// --- Route segment: UUID = old Storage programme, anything else = Drive ID ---
assert.equal(isLegacyProgramId("6f1c2a54-3b1d-4f8e-9a77-0c2d5e8b9f10"), true);
assert.equal(isLegacyProgramId("19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd"), false);
assert.equal(isLegacyProgramId("1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB"), false);

console.log("utils/drive/tree.test.ts: ok");
