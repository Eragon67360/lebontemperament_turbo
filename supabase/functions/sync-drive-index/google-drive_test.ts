// Run: npx -y deno test --node-modules-dir=none supabase/functions/sync-drive-index/
import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createDriveReader, type FetchLike } from "./google-drive.ts";
import { DriveAccessError, FOLDER_MIME, walkRoots } from "./plan.ts";

type Page = Record<string, unknown>;

/** A fake Drive API: pages per folder id, keyed by pageToken ("" first). */
function fakeDrive(
  pages: Record<string, Record<string, Page>>,
  folders: Record<string, Page> = {},
): { fetch: FetchLike; urls: URL[] } {
  const urls: URL[] = [];
  const fetch: FetchLike = (input) => {
    const url = new URL(input);
    urls.push(url);
    const json = (body: unknown, status = 200) =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    if (url.pathname.endsWith("/files")) {
      const q = url.searchParams.get("q") ?? "";
      const id = /'([^']+)' in parents/.exec(q)?.[1] ?? "";
      const token = url.searchParams.get("pageToken") ?? "";
      const page = pages[id]?.[token];
      return page
        ? json(page)
        : json({ error: { message: "File not found" } }, 404);
    }
    const id = decodeURIComponent(url.pathname.split("/").pop() ?? "");
    const folder = folders[id];
    return folder
      ? json(folder)
      : json({ error: { message: "File not found" } }, 404);
  };
  return { fetch, urls };
}

Deno.test(
  "listChildren follows nextPageToken and asks for incompleteSearch",
  async () => {
    const drive = fakeDrive({
      root: {
        "": {
          files: [{ id: "a", name: "A", mimeType: "x" }],
          nextPageToken: "p2",
        },
        p2: { files: [{ id: "b", name: "B", mimeType: "x" }] },
      },
    });
    const reader = createDriveReader("token", drive.fetch);
    const items = await reader.listChildren("root");
    assertEquals(
      items.map((i) => i.id),
      ["a", "b"],
    );
    assertEquals(drive.urls.length, 2);
    const params = drive.urls[0].searchParams;
    assert(params.get("fields")?.includes("incompleteSearch"));
    assertEquals(params.get("pageSize"), "200");
    assertEquals(params.get("supportsAllDrives"), "true");
    assertEquals(params.get("includeItemsFromAllDrives"), "true");
    assertEquals(params.get("q"), "'root' in parents and trashed = false");
    assertEquals(drive.urls[1].searchParams.get("pageToken"), "p2");
  },
);

Deno.test(
  "listChildren refuses a listing Drive reports as incomplete",
  async () => {
    const drive = fakeDrive({
      root: {
        "": {
          files: [{ id: "a", name: "A", mimeType: "x" }],
          incompleteSearch: true,
        },
      },
    });
    const reader = createDriveReader("token", drive.fetch);
    await assertRejects(
      () => reader.listChildren("root"),
      DriveAccessError,
      "incompleteSearch",
    );
  },
);

Deno.test(
  "an incomplete listing makes the root unreadable and keeps its nodes",
  async () => {
    const drive = fakeDrive(
      {
        ok: { "": { files: [{ id: "f1", name: "F1.pdf", mimeType: "x" }] } },
        partial: {
          "": {
            files: [{ id: "f2", name: "F2.pdf", mimeType: "x" }],
            incompleteSearch: true,
          },
        },
      },
      {
        ok: { id: "ok", name: "OK", mimeType: FOLDER_MIME },
        partial: { id: "partial", name: "Partial", mimeType: FOLDER_MIME },
      },
    );
    const reader = createDriveReader("token", drive.fetch);
    const result = await walkRoots(
      [
        { slug: "adultes", folder_id: "ok", display_order: 0 },
        { slug: "jeunes", folder_id: "partial", display_order: 1 },
      ],
      reader,
    );
    assertEquals(result.readableRootSlugs, ["adultes"]);
    assertEquals(
      result.unreadableRoots.map((r) => r.slug),
      ["jeunes"],
    );
    assert(result.unreadableRoots[0].reason.includes("incompleteSearch"));
    assertEquals(
      result.nodes.map((n) => n.drive_id),
      ["ok", "f1"],
    );
  },
);

Deno.test("getFolder surfaces Google's status and message", async () => {
  const drive = fakeDrive({}, {});
  const reader = createDriveReader("token", drive.fetch);
  const error = await assertRejects(
    () => reader.getFolder("missing"),
    DriveAccessError,
    "File not found",
  );
  assertEquals(error.status, 404);
});
