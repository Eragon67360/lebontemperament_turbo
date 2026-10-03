import assert from "node:assert/strict";
import {
  CONTENT_DISPOSITION_MAX_BYTES,
  asciiFileName,
  contentDisposition,
  driveDownloadName,
  driveDownloadPlan,
  listAllDrivePages,
  type DrivePage,
} from "./driveDownload";

// --- contentDisposition ------------------------------------------------------

// Plain ASCII: both parameters carry the same name.
assert.equal(
  contentDisposition("Partition.pdf"),
  `attachment; filename="Partition.pdf"; filename*=UTF-8''Partition.pdf`,
);

// Accents: the fallback is stripped, the UTF-8 name is percent-encoded.
assert.equal(
  contentDisposition("Chœur d'été – Noël.pdf"),
  `attachment; filename="Choeur d'ete _ Noel.pdf"; filename*=UTF-8''Ch%C5%93ur%20d%27%C3%A9t%C3%A9%20%E2%80%93%20No%C3%ABl.pdf`,
);

// Quotes and backslashes can't break the quoted-string; `'()*` are encoded.
assert.equal(
  contentDisposition(`Air "Les (vrais)" \\ ténors*.mp3`),
  `attachment; filename="Air _Les (vrais)_ _ tenors*.mp3"; filename*=UTF-8''Air%20%22Les%20%28vrais%29%22%20%5C%20t%C3%A9nors%2A.mp3`,
);

// Line breaks never reach the header (no header injection).
const injected = contentDisposition("a.pdf\r\nX-Evil: 1");
assert.ok(!/[\r\n]/.test(injected));
assert.equal(
  injected,
  `attachment; filename="a.pdfX-Evil: 1"; filename*=UTF-8''a.pdfX-Evil%3A%201`,
);

// Empty names get a placeholder.
assert.equal(
  contentDisposition("   "),
  `attachment; filename="fichier"; filename*=UTF-8''fichier`,
);

// Very long names are capped, the extension is kept, and the header stays
// well under typical proxy limits.
const longName = `${"é".repeat(400)}.pdf`;
const longHeader = contentDisposition(longName);
const longUtf8 = decodeURIComponent(longHeader.split("filename*=UTF-8''")[1]!);
assert.ok(longUtf8.endsWith(".pdf"));
assert.ok(
  new TextEncoder().encode(longUtf8).length <= CONTENT_DISPOSITION_MAX_BYTES,
);
assert.ok(new TextEncoder().encode(longUtf8).length > 250);
assert.ok(longHeader.length < 1100, `header too long: ${longHeader.length}`);
assert.match(longHeader, /filename="e+\.pdf"/);

// A long name without an extension is cut too; a short one is untouched.
assert.ok(
  new TextEncoder().encode(
    decodeURIComponent(
      contentDisposition("x".repeat(300)).split("filename*=UTF-8''")[1]!,
    ),
  ).length === CONTENT_DISPOSITION_MAX_BYTES,
);
assert.equal(
  contentDisposition("Nom court.pdf"),
  `attachment; filename="Nom court.pdf"; filename*=UTF-8''Nom%20court.pdf`,
);

// Inline mode uses the same parameters.
assert.equal(
  contentDisposition("Doc été.pdf", "inline"),
  `inline; filename="Doc ete.pdf"; filename*=UTF-8''Doc%20%C3%A9t%C3%A9.pdf`,
);

assert.equal(asciiFileName("Übung — Ça va.txt"), "Ubung _ Ca va.txt");
assert.equal(asciiFileName("日本語"), "___");
assert.equal(asciiFileName(""), "fichier");

// --- driveDownloadPlan / driveDownloadName -----------------------------------

assert.deepEqual(driveDownloadPlan("application/pdf"), {
  kind: "media",
  mimeType: "application/pdf",
});
assert.deepEqual(driveDownloadPlan(undefined), {
  kind: "media",
  mimeType: "application/octet-stream",
});
assert.deepEqual(driveDownloadPlan("application/vnd.google-apps.document"), {
  kind: "export",
  mimeType: "application/pdf",
  extension: ".pdf",
});
assert.equal(
  driveDownloadPlan("application/vnd.google-apps.spreadsheet").kind,
  "export",
);
assert.equal(
  driveDownloadPlan("application/vnd.google-apps.presentation").kind,
  "export",
);
assert.equal(
  driveDownloadPlan("application/vnd.google-apps.folder").kind,
  "unsupported",
);
assert.equal(
  driveDownloadPlan("application/vnd.google-apps.form").kind,
  "unsupported",
);
assert.equal(
  driveDownloadPlan("application/vnd.google-apps.shortcut").kind,
  "unsupported",
);

const exportPlan = driveDownloadPlan("application/vnd.google-apps.document");
assert.equal(driveDownloadName("Programme", exportPlan), "Programme.pdf");
assert.equal(driveDownloadName("Programme.PDF", exportPlan), "Programme.PDF");
assert.equal(
  driveDownloadName("Partition.pdf", driveDownloadPlan("application/pdf")),
  "Partition.pdf",
);
assert.equal(
  driveDownloadName(undefined, driveDownloadPlan("application/pdf")),
  "fichier",
);

// --- listAllDrivePages -------------------------------------------------------

type Item = { id: string };

/** Mocked `files.list`: `pages[i]` answers the i-th call; records tokens. */
const mockDrive = (pages: DrivePage<Item>[]) => {
  const tokens: (string | undefined)[] = [];
  const fetchPage = async (token: string | undefined) => {
    tokens.push(token);
    const page = pages[tokens.length - 1];
    if (!page) throw new Error(`unexpected call ${tokens.length}`);
    return page;
  };
  return { tokens, fetchPage };
};

const ids = (from: number, count: number): Item[] =>
  Array.from({ length: count }, (_, i) => ({ id: `item-${from + i}` }));

const main = async () => {
  // Three pages are followed in order, with each token sent back.
  await (async () => {
    const drive = mockDrive([
      { files: ids(0, 100), nextPageToken: "tok-1" },
      { files: ids(100, 100), nextPageToken: "tok-2" },
      { files: ids(200, 37), nextPageToken: null },
    ]);
    const result = await listAllDrivePages(drive.fetchPage);
    assert.equal(result.items.length, 237);
    assert.equal(result.items[0]!.id, "item-0");
    assert.equal(result.items[236]!.id, "item-236");
    assert.equal(result.truncated, false);
    assert.deepEqual(drive.tokens, [undefined, "tok-1", "tok-2"]);
  })();

  // A single page without a token means one call.
  await (async () => {
    const drive = mockDrive([{ files: ids(0, 3) }]);
    const result = await listAllDrivePages(drive.fetchPage);
    assert.deepEqual(
      result.items.map((i) => i.id),
      ["item-0", "item-1", "item-2"],
    );
    assert.equal(result.truncated, false);
    assert.deepEqual(drive.tokens, [undefined]);
  })();

  // The cap stops the loop and reports the truncation (no extra call).
  await (async () => {
    const drive = mockDrive([
      { files: ids(0, 100), nextPageToken: "tok-1" },
      { files: ids(100, 100), nextPageToken: "tok-2" },
      { files: ids(200, 100), nextPageToken: "tok-3" },
    ]);
    const result = await listAllDrivePages(drive.fetchPage, 250);
    assert.equal(result.items.length, 250);
    assert.equal(result.truncated, true);
    assert.deepEqual(drive.tokens, [undefined, "tok-1", "tok-2"]);
  })();

  // Exactly at the cap with more pages pending: truncated, nothing dropped.
  await (async () => {
    const drive = mockDrive([
      { files: ids(0, 100), nextPageToken: "tok-1" },
      { files: ids(100, 100), nextPageToken: "tok-2" },
    ]);
    const result = await listAllDrivePages(drive.fetchPage, 200);
    assert.equal(result.items.length, 200);
    assert.equal(result.truncated, true);
    assert.deepEqual(drive.tokens, [undefined, "tok-1"]);
  })();

  // Exactly at the cap with no more pages: complete, not truncated.
  await (async () => {
    const drive = mockDrive([
      { files: ids(0, 100), nextPageToken: "tok-1" },
      { files: ids(100, 100) },
    ]);
    const result = await listAllDrivePages(drive.fetchPage, 200);
    assert.equal(result.items.length, 200);
    assert.equal(result.truncated, false);
  })();

  // Empty folder, and a page with `files` missing.
  await (async () => {
    const drive = mockDrive([{ files: null, nextPageToken: "" }]);
    const result = await listAllDrivePages(drive.fetchPage);
    assert.deepEqual(result, { items: [], truncated: false });
  })();

  // A token the API repeats never spins the loop.
  await (async () => {
    const drive = mockDrive([
      { files: ids(0, 2), nextPageToken: "same" },
      { files: ids(2, 2), nextPageToken: "same" },
      { files: ids(4, 2), nextPageToken: "same" },
    ]);
    const result = await listAllDrivePages(drive.fetchPage);
    assert.equal(result.items.length, 4);
    assert.deepEqual(drive.tokens, [undefined, "same"]);
  })();

  // Drive errors propagate to the route (which answers 500).
  await assert.rejects(
    listAllDrivePages(async () => {
      throw new Error("quota");
    }),
    /quota/,
  );

  console.log("driveDownload: all assertions passed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
