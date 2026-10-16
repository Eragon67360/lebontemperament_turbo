import assert from "node:assert/strict";
import {
  driveFolderUrl,
  extractDriveFolderId,
  planDriveFolderUpdate,
  slugifyDriveLabel,
  type DriveFolderRef,
} from "./drive";

const id = "19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd";

assert.equal(extractDriveFolderId(id), id);
assert.equal(extractDriveFolderId(`  ${id}  `), id);
assert.equal(
  extractDriveFolderId(`https://drive.google.com/drive/folders/${id}`),
  id,
);
assert.equal(
  extractDriveFolderId(
    `https://drive.google.com/drive/folders/${id}?usp=sharing`,
  ),
  id,
);
assert.equal(
  extractDriveFolderId(`https://drive.google.com/drive/u/0/folders/${id}`),
  id,
);
assert.equal(
  extractDriveFolderId(`https://drive.google.com/file/d/${id}/view`),
  id,
);
assert.equal(
  extractDriveFolderId(`https://drive.google.com/open?id=${id}`),
  id,
);
assert.equal(extractDriveFolderId(""), "");
assert.equal(extractDriveFolderId("too-short"), "");
assert.equal(
  extractDriveFolderId("https://drive.google.com/drive/my-drive"),
  "",
);
assert.equal(
  driveFolderUrl(id),
  `https://drive.google.com/drive/folders/${id}`,
);

// --- slugifyDriveLabel ---
assert.equal(slugifyDriveLabel("Cahier 40 ans"), "cahier-40-ans");
assert.equal(slugifyDriveLabel("  Chœur d'été  "), "choeur-d-ete");
assert.equal(slugifyDriveLabel("Éveil & Jeux !"), "eveil-jeux");
assert.equal(slugifyDriveLabel("---"), "");
assert.equal(slugifyDriveLabel("!!!"), "");
assert.equal(slugifyDriveLabel("a".repeat(100)).length, 60);
assert.ok(!slugifyDriveLabel(`${"a".repeat(59)} b`).endsWith("-"));

// --- planDriveFolderUpdate ---
const folder = (
  slug: string,
  label: string,
  folder_id: string,
): DriveFolderRef => ({ id: `id-${slug}`, slug, label, folder_id });
const rootRow = folder("racine", "Drive complet", "R".repeat(12));
const adultes = folder("adultes", "Adultes", "A".repeat(12));
const cahier = folder("cahier-30-ans", "Cahier 30 ans", "C".repeat(12));
const others = (current: DriveFolderRef) =>
  [rootRow, adultes, cahier].filter((f) => f.slug !== current.slug);
const newId = "N".repeat(12);

// The slug follows the name.
assert.deepEqual(
  planDriveFolderUpdate(cahier, others(cahier), { label: "Cahier 40 ans" }),
  {
    ok: true,
    patch: { label: "Cahier 40 ans", slug: "cahier-40-ans" },
    slugChanged: true,
    folderChanged: false,
  },
);
// Name and Drive folder together; a URL is accepted.
assert.deepEqual(
  planDriveFolderUpdate(cahier, others(cahier), {
    label: "  Cahier  40 ans ",
    folder_id: `https://drive.google.com/drive/folders/${newId}?usp=sharing`,
  }),
  {
    ok: true,
    patch: { label: "Cahier 40 ans", slug: "cahier-40-ans", folder_id: newId },
    slugChanged: true,
    folderChanged: true,
  },
);
// Nothing changes: empty patch.
assert.deepEqual(
  planDriveFolderUpdate(cahier, others(cahier), {
    label: "Cahier 30 ans",
    folder_id: cahier.folder_id,
  }),
  { ok: true, patch: {}, slugChanged: false, folderChanged: false },
);
// A name change that keeps the slug (case, accents) touches the label only.
assert.deepEqual(
  planDriveFolderUpdate(cahier, others(cahier), { label: "Cahier 30 Ans" }),
  {
    ok: true,
    patch: { label: "Cahier 30 Ans" },
    slugChanged: false,
    folderChanged: false,
  },
);
// Folders the code relies on keep their slug.
assert.deepEqual(
  planDriveFolderUpdate(adultes, others(adultes), { label: "Chœur adulte" }),
  {
    ok: true,
    patch: { label: "Chœur adulte" },
    slugChanged: false,
    folderChanged: false,
  },
);
// Drive folder only.
assert.deepEqual(
  planDriveFolderUpdate(adultes, others(adultes), { folder_id: newId }),
  {
    ok: true,
    patch: { folder_id: newId },
    slugChanged: false,
    folderChanged: true,
  },
);
// Refusals.
const refused = (
  current: DriveFolderRef,
  input: { label?: unknown; folder_id?: unknown },
) => {
  const plan = planDriveFolderUpdate(current, others(current), input);
  return plan.ok ? null : plan.error;
};
assert.ok(refused(rootRow, { label: "Autre" }));
assert.ok(refused(cahier, { label: "   " }));
assert.ok(refused(cahier, { label: 42 }));
assert.ok(refused(cahier, { label: "x".repeat(61) }));
assert.ok(refused(cahier, { label: "???" }));
assert.ok(refused(cahier, { label: "Adultes" }), "name of another folder");
assert.ok(refused(cahier, { label: "Racine" }), "reserved for the Drive root");
assert.ok(refused(cahier, { folder_id: "too-short" }));
assert.ok(refused(cahier, { folder_id: adultes.folder_id }), "folder in use");
assert.ok(refused(cahier, { label: "Cahier 40 ans", folder_id: 12 }));

console.log("drive: all assertions passed");
