// Run: npx -y deno test --node-modules-dir=none supabase/functions/sync-drive-index/
import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CRON_REMOVALS_REFUSED,
  DriveAccessError,
  FOLDER_MIME,
  SHORTCUT_MIME,
  WalkLimitError,
  describeFailure,
  diffIndex,
  joinPath,
  kindOf,
  planApply,
  toIndexNode,
  toRunDiff,
  walkRoots,
  type DriveItem,
  type DriveReader,
  type ExistingNode,
  type IndexNode,
  type WalkResult,
} from "./plan.ts";

// --- Fixtures: an in-memory Drive ---------------------------------------

const folder = (id: string, name: string): DriveItem => ({
  id,
  name,
  mimeType: FOLDER_MIME,
});
const file = (id: string, name: string, extra: Partial<DriveItem> = {}) => ({
  id,
  name,
  mimeType: "application/pdf",
  size: "1234",
  modifiedTime: "2026-09-01T10:00:00.000Z",
  md5Checksum: "d41d8cd98f00b204e9800998ecf8427e",
  ...extra,
});

interface FakeDrive {
  folders: Record<string, DriveItem>;
  children: Record<string, DriveItem[]>;
  /** Folder IDs the service account can't read (403). */
  forbidden?: string[];
  /** Folder IDs whose listing fails (500). */
  broken?: string[];
}

function fakeReader(drive: FakeDrive, calls: string[] = []): DriveReader {
  return {
    getFolder(id) {
      calls.push(`get:${id}`);
      if (drive.forbidden?.includes(id)) {
        return Promise.reject(
          new DriveAccessError(403, "The caller does not have permission"),
        );
      }
      const found = drive.folders[id];
      return found
        ? Promise.resolve(found)
        : Promise.reject(new DriveAccessError(404, "File not found"));
    },
    listChildren(id) {
      calls.push(`list:${id}`);
      if (drive.broken?.includes(id)) {
        return Promise.reject(new DriveAccessError(500, "Backend Error"));
      }
      return Promise.resolve(drive.children[id] ?? []);
    },
  };
}

// racine contains adultes (a configured root) and a loose file; adultes has a
// programme folder with a group folder, a file and a shortcut.
const DRIVE: FakeDrive = {
  folders: {
    root: folder("root", "Drive complet"),
    adultes: folder("adultes", "Adultes"),
    prog: folder("prog", "Programme 2026"),
    group: folder("group", "Soprano"),
    jeunes: folder("jeunes", "Jeunes"),
  },
  children: {
    root: [folder("adultes", "Adultes"), file("readme", "Lisez-moi.pdf")],
    adultes: [folder("prog", "Programme 2026")],
    prog: [
      folder("group", "Soprano"),
      file("score", "Partition.pdf"),
      { id: "short", name: "Raccourci", mimeType: SHORTCUT_MIME },
    ],
    group: [file("s1", "Soprano 1.pdf")],
    jeunes: [],
  },
};

const ROOTS = [
  { slug: "racine", folder_id: "root", display_order: 0 },
  { slug: "adultes", folder_id: "adultes", display_order: 1 },
  { slug: "jeunes", folder_id: "jeunes", display_order: 2 },
];

const byId = (nodes: IndexNode[]) =>
  Object.fromEntries(nodes.map((n) => [n.drive_id, n]));

// --- Path and kind --------------------------------------------------------

Deno.test("joinPath joins names with ' / ' from the root", () => {
  assertEquals(joinPath(null, "Drive complet"), "Drive complet");
  assertEquals(
    joinPath("Adultes", "Programme 2026"),
    "Adultes / Programme 2026",
  );
  assertEquals(
    joinPath("Adultes / Programme 2026", "Soprano"),
    "Adultes / Programme 2026 / Soprano",
  );
});

Deno.test("kindOf: only real folders are folders, shortcuts are files", () => {
  assertEquals(kindOf(FOLDER_MIME), "folder");
  assertEquals(kindOf(SHORTCUT_MIME), "file");
  assertEquals(kindOf("application/pdf"), "file");
  assertEquals(kindOf(undefined), "file");
});

Deno.test("toIndexNode keeps metadata and parses size", () => {
  const node = toIndexNode(
    file("score", "Partition.pdf"),
    "adultes",
    "prog",
    "Adultes / Programme 2026",
    2,
  );
  assertEquals(node, {
    drive_id: "score",
    parent_drive_id: "prog",
    root_slug: "adultes",
    kind: "file",
    name: "Partition.pdf",
    mime_type: "application/pdf",
    size: 1234,
    modified_time: "2026-09-01T10:00:00.000Z",
    md5_checksum: "d41d8cd98f00b204e9800998ecf8427e",
    path: "Adultes / Programme 2026 / Partition.pdf",
    depth: 2,
  });
  assertEquals(
    toIndexNode(folder("x", "X"), "racine", null, null, 0).size,
    null,
  );
});

// --- Walk -------------------------------------------------------------------

Deno.test(
  "walkRoots: breadth-first, nested roots cut, shortcuts not followed",
  async () => {
    const calls: string[] = [];
    const result = await walkRoots(ROOTS, fakeReader(DRIVE, calls));

    assertEquals(result.unreadableRoots, []);
    assertEquals(result.readableRootSlugs, ["racine", "adultes", "jeunes"]);

    const nodes = byId(result.nodes);
    // The adultes folder belongs to its own slug, not to racine.
    assertEquals(nodes["adultes"].root_slug, "adultes");
    assertEquals(nodes["adultes"].depth, 0);
    assertEquals(nodes["adultes"].parent_drive_id, null);
    assertEquals(nodes["readme"].root_slug, "racine");
    assertEquals(nodes["readme"].path, "Drive complet / Lisez-moi.pdf");
    assertEquals(
      nodes["s1"].path,
      "Adultes / Programme 2026 / Soprano / Soprano 1.pdf",
    );
    assertEquals(nodes["s1"].depth, 3);
    assertEquals(nodes["short"].kind, "file");
    assertEquals(nodes["short"].mime_type, SHORTCUT_MIME);
    assertEquals(result.nodes.length, 9);

    // Racine never lists the adultes folder; only its own root does.
    assertEquals(calls.filter((c) => c === "list:adultes").length, 1);
    assert(!calls.includes("list:short"));
  },
);

Deno.test(
  "walkRoots: an unreadable root is reported and skipped, the others are walked",
  async () => {
    const result = await walkRoots(
      ROOTS,
      fakeReader({ ...DRIVE, forbidden: ["adultes"] }),
    );
    assertEquals(result.unreadableRoots.length, 1);
    assertEquals(result.unreadableRoots[0].slug, "adultes");
    assert(result.unreadableRoots[0].reason.includes("permission"));
    assertEquals(result.readableRootSlugs, ["racine", "jeunes"]);
    // Nothing of the adultes subtree appears under any slug.
    const ids = result.nodes.map((n) => n.drive_id);
    assert(!ids.includes("prog"));
    assert(!ids.includes("adultes"));
    assert(ids.includes("readme"));
  },
);

Deno.test(
  "walkRoots: a listing failure midway leaves that root unreadable with no partial nodes",
  async () => {
    const result = await walkRoots(
      ROOTS,
      fakeReader({ ...DRIVE, broken: ["prog"] }),
    );
    assertEquals(
      result.unreadableRoots.map((r) => r.slug),
      ["adultes"],
    );
    const ids = result.nodes.map((n) => n.drive_id);
    assert(!ids.includes("adultes"));
    assert(!ids.includes("prog"));
    assert(ids.includes("jeunes"));
  },
);

Deno.test(
  "walkRoots: an unknown root (404) is unreadable, not fatal",
  async () => {
    const result = await walkRoots(
      [{ slug: "enfants", folder_id: "missing", display_order: 0 }],
      fakeReader(DRIVE),
    );
    assertEquals(result.nodes, []);
    assertEquals(
      result.unreadableRoots.map((r) => r.slug),
      ["enfants"],
    );
  },
);

Deno.test("walkRoots: a root that is not a folder is unreadable", async () => {
  const result = await walkRoots(
    [{ slug: "racine", folder_id: "pdf", display_order: 0 }],
    fakeReader({
      folders: { pdf: file("pdf", "Un fichier.pdf") },
      children: {},
    }),
  );
  assertEquals(result.unreadableRoots.length, 1);
  assert(result.unreadableRoots[0].reason.includes("dossier"));
});

Deno.test("walkRoots: the node cap fails the run", async () => {
  await assertRejects(
    () =>
      walkRoots(ROOTS, fakeReader(DRIVE), {
        caps: { maxDepth: 8, maxNodes: 5 },
      }),
    WalkLimitError,
    "Plus de 5",
  );
});

Deno.test("walkRoots: the depth cap fails the run", async () => {
  await assertRejects(
    () =>
      walkRoots(ROOTS, fakeReader(DRIVE), {
        caps: { maxDepth: 2, maxNodes: 5000 },
      }),
    WalkLimitError,
    "profondeur",
  );
  // Depth 3 is enough for this tree: the deepest folder (depth 2) has files.
  const ok = await walkRoots(ROOTS, fakeReader(DRIVE), {
    caps: { maxDepth: 3, maxNodes: 5000 },
  });
  assertEquals(ok.nodes.length, 9);
});

Deno.test("walkRoots: a file with two parents is recorded once", async () => {
  const shared = file("shared", "Commun.pdf");
  const result = await walkRoots(
    [
      { slug: "a", folder_id: "a", display_order: 0 },
      { slug: "b", folder_id: "b", display_order: 1 },
    ],
    fakeReader({
      folders: { a: folder("a", "A"), b: folder("b", "B") },
      children: { a: [shared], b: [shared] },
    }),
  );
  const found = result.nodes.filter((n) => n.drive_id === "shared");
  assertEquals(found.length, 1);
  assertEquals(found[0].root_slug, "a");
});

// --- Diff -------------------------------------------------------------------

const existing = (
  drive_id: string,
  name: string,
  path: string,
  extra: Partial<ExistingNode> = {},
): ExistingNode => ({
  drive_id,
  parent_drive_id: "prog",
  root_slug: "adultes",
  kind: "file",
  name,
  path,
  removed_at: null,
  ...extra,
});

Deno.test(
  "diffIndex classifies added, renamed, moved, removed and unchanged",
  async () => {
    const walk = await walkRoots(ROOTS, fakeReader(DRIVE));
    const index: ExistingNode[] = [
      existing(
        "score",
        "Partition.pdf",
        "Adultes / Programme 2026 / Partition.pdf",
      ),
      existing("short", "Ancien nom", "Adultes / Programme 2026 / Ancien nom"),
      existing(
        "s1",
        "Soprano 1.pdf",
        "Adultes / Programme 2026 / Soprano 1.pdf",
      ),
      existing("gone", "Disparu.pdf", "Adultes / Programme 2026 / Disparu.pdf"),
      existing("back", "Revenu.pdf", "Adultes / Revenu.pdf", {
        removed_at: "2026-09-01T00:00:00.000Z",
      }),
    ];

    const diff = diffIndex(walk, index);

    assertEquals(diff.counts, {
      added: 6, // root, adultes, readme, prog, group, jeunes
      renamed: 1,
      moved: 1,
      removed: 1,
      unchanged: 1,
      unreadable_roots: 0,
    });
    assertEquals(diff.renamed[0].name, "Raccourci");
    assertEquals(diff.renamed[0].previous_name, "Ancien nom");
    assertEquals(diff.moved[0].name, "Soprano 1.pdf");
    assertEquals(
      diff.moved[0].previous_path,
      "Adultes / Programme 2026 / Soprano 1.pdf",
    );
    assertEquals(
      diff.moved[0].path,
      "Adultes / Programme 2026 / Soprano / Soprano 1.pdf",
    );
    assertEquals(diff.removed[0].name, "Disparu.pdf");
    assertEquals(diff.removeIds, ["gone"]);
    // A row already removed and still absent stays removed, silently.
    assert(!diff.removed.some((e) => e.name === "Revenu.pdf"));
  },
);

Deno.test(
  "diffIndex: a previously removed node that reappears is added",
  () => {
    const walk: WalkResult = {
      nodes: [
        toIndexNode(
          file("back", "Revenu.pdf"),
          "adultes",
          "adultes",
          "Adultes",
          1,
        ),
      ],
      readableRootSlugs: ["adultes"],
      unreadableRoots: [],
    };
    const diff = diffIndex(walk, [
      existing("back", "Revenu.pdf", "Adultes / Revenu.pdf", {
        parent_drive_id: "adultes",
        removed_at: "2026-09-01T00:00:00.000Z",
      }),
    ]);
    assertEquals(diff.counts.added, 1);
    assertEquals(diff.counts.removed, 0);
  },
);

Deno.test(
  "diffIndex: rows under an unreadable root are never removed",
  async () => {
    const walk = await walkRoots(
      ROOTS,
      fakeReader({ ...DRIVE, forbidden: ["adultes"] }),
    );
    const diff = diffIndex(walk, [
      existing(
        "score",
        "Partition.pdf",
        "Adultes / Programme 2026 / Partition.pdf",
      ),
      existing("old-readme", "Vieux.pdf", "Drive complet / Vieux.pdf", {
        root_slug: "racine",
        parent_drive_id: "root",
      }),
    ]);
    assertEquals(diff.counts.unreadable_roots, 1);
    assertEquals(diff.counts.removed, 1);
    assertEquals(diff.removeIds, ["old-readme"]);
  },
);

Deno.test("toRunDiff caps each group and records the full length", () => {
  const many = Array.from({ length: 5 }, (_, i) => ({
    kind: "file" as const,
    name: `f${i}`,
    path: `A / f${i}`,
  }));
  const run = toRunDiff(
    {
      added: many,
      renamed: [],
      moved: [],
      removed: many.slice(0, 2),
      unreadable_roots: [{ slug: "jeunes", reason: "403" }],
      removeIds: [],
      counts: {
        added: 5,
        renamed: 0,
        moved: 0,
        removed: 2,
        unchanged: 0,
        unreadable_roots: 1,
      },
    },
    3,
  );
  assertEquals(run.added.length, 3);
  assertEquals(run.removed.length, 2);
  assertEquals(run.truncated, { added: 5 });
  assertEquals(run.unreadable_roots[0].slug, "jeunes");
  // Names and paths only: no Drive IDs leak into the run row.
  assertEquals(Object.keys(run.added[0]).sort(), ["kind", "name", "path"]);
});

// --- Cron apply safety --------------------------------------------------

const liveRows = (slug: string, n: number): ExistingNode[] =>
  Array.from({ length: n }, (_, i) =>
    existing(`${slug}-${i}`, `f${i}.pdf`, `${slug} / f${i}.pdf`, {
      root_slug: slug,
      parent_drive_id: slug,
    }),
  );

const emptyWalk = (...slugs: string[]): WalkResult => ({
  nodes: slugs.map((slug) =>
    toIndexNode(folder(slug, slug), slug, null, null, 0),
  ),
  readableRootSlugs: slugs,
  unreadableRoots: [],
});

Deno.test("planApply: an admin apply writes the whole diff", () => {
  const rows = liveRows("adultes", 10);
  const walk = emptyWalk("adultes"); // everything under adultes disappeared
  const diff = diffIndex(walk, rows);
  assertEquals(diff.counts.removed, 10);
  const plan = planApply(walk, diff, rows, "admin");
  assertEquals(plan.status, "success");
  assertEquals(plan.removeIds.length, 10);
  assertEquals(plan.blockedRoots, []);
});

Deno.test(
  "planApply: a cron apply refuses removals above 20 % of a root",
  () => {
    const rows = liveRows("adultes", 10);
    const walk = emptyWalk("adultes");
    const diff = diffIndex(walk, rows);
    const plan = planApply(walk, diff, rows, "cron");
    assertEquals(plan.status, "error");
    assert(plan.error?.startsWith(CRON_REMOVALS_REFUSED));
    assert(plan.error?.includes("adultes"));
    assertEquals(plan.blockedRoots, ["adultes"]);
    // Nothing of that root is written, not even the root node.
    assertEquals(plan.removeIds, []);
    assertEquals(plan.nodes, []);
  },
);

Deno.test("planApply: a cron apply within the limits goes through", () => {
  const rows = liveRows("adultes", 10);
  // Nine of ten files still there: one removal, 10 %.
  const walk: WalkResult = {
    nodes: rows
      .slice(1)
      .map((row) =>
        toIndexNode(
          file(row.drive_id, row.name),
          "adultes",
          "adultes",
          "adultes",
          1,
        ),
      ),
    readableRootSlugs: ["adultes"],
    unreadableRoots: [],
  };
  const diff = diffIndex(walk, rows);
  assertEquals(diff.counts.removed, 1);
  const plan = planApply(walk, diff, rows, "cron");
  assertEquals(plan.status, "success");
  assertEquals(plan.removeIds, ["adultes-0"]);
});

Deno.test(
  "planApply: the absolute cap applies even on a big root, and other roots still apply",
  () => {
    const rows = [...liveRows("racine", 1000), ...liveRows("jeunes", 10)];
    // 60 removals under racine (6 %), all 10 under jeunes (100 %).
    const keptRacine = rows.slice(60, 1000);
    const walk: WalkResult = {
      nodes: keptRacine.map((row) =>
        toIndexNode(
          file(row.drive_id, row.name),
          "racine",
          "racine",
          "racine",
          1,
        ),
      ),
      readableRootSlugs: ["racine", "jeunes"],
      unreadableRoots: [],
    };
    const diff = diffIndex(walk, rows);
    assertEquals(diff.counts.removed, 70);
    const plan = planApply(walk, diff, rows, "cron");
    assertEquals(plan.status, "error");
    assertEquals(plan.blockedRoots, ["jeunes", "racine"]);
    assertEquals(plan.removeIds, []);
    // With only the ratio exceeded on jeunes, racine applies and jeunes is held back.
    const smallDiff = diffIndex(
      {
        ...walk,
        nodes: rows
          .slice(10, 1000)
          .map((row) =>
            toIndexNode(
              file(row.drive_id, row.name),
              "racine",
              "racine",
              "racine",
              1,
            ),
          ),
      },
      rows,
    );
    const plan2 = planApply(walk, smallDiff, rows, "cron");
    assertEquals(plan2.blockedRoots, ["jeunes"]);
    assertEquals(plan2.removeIds.length, 10);
    assert(plan2.removeIds.every((id) => id.startsWith("racine-")));
    assert(plan2.nodes.every((n) => n.root_slug === "racine"));
  },
);

Deno.test("planApply: a cron apply with no removals is never blocked", () => {
  const rows = liveRows("adultes", 3);
  const walk: WalkResult = {
    nodes: rows.map((row) =>
      toIndexNode(
        file(row.drive_id, row.name),
        "adultes",
        "adultes",
        "adultes",
        1,
      ),
    ),
    readableRootSlugs: ["adultes"],
    unreadableRoots: [],
  };
  const plan = planApply(walk, diffIndex(walk, rows), rows, "cron");
  assertEquals(plan.status, "success");
  assertEquals(plan.nodes.length, 3);
});

// --- Failure wording -------------------------------------------------------

Deno.test("describeFailure: plain French for admins, detail kept apart", () => {
  const limit = describeFailure(
    new WalkLimitError(
      "Plus de 5000 éléments sous les dossiers Drive : la synchronisation s'arrête.",
    ),
  );
  assertEquals(limit.code, "limit");
  assert(limit.message.startsWith("Plus de 5000"));

  const drive = describeFailure(new DriveAccessError(500, "Backend Error"));
  assertEquals(drive.code, "drive");
  assert(!drive.message.includes("Backend Error"));
  assertEquals(drive.detail, "Backend Error");

  const auth = describeFailure(
    new Error("Google token request failed: invalid_grant"),
  );
  assertEquals(auth.code, "google_auth");
  assert(!auth.message.includes("invalid_grant"));

  const db = describeFailure(
    new Error(
      "drive_index_apply: permission denied for table drive_index_nodes",
    ),
  );
  assertEquals(db.code, "database");
  assert(!db.message.includes("permission denied"));

  assertEquals(
    describeFailure(
      new Error(
        "Missing required environment variable: GOOGLE_SERVICE_ACCOUNT_JSON",
      ),
    ).code,
    "config",
  );
  assertEquals(describeFailure("boom").code, "internal");
});
