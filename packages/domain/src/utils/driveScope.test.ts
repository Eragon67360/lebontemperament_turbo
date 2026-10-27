import assert from "node:assert/strict";
import { DRIVE_ROOT_SLUG } from "./drive";
import {
  DRIVE_SCOPE_MAX_DEPTH,
  driveScopeRoots,
  isDriveId,
  isDriveItemAllowedFor,
  isWithinDriveRoots,
  memoizeParentsLookup,
  type DriveCaller,
  type DriveParentsLookup,
  type DriveRootRow,
} from "./driveScope";

// Fake tree (IDs are made up):
//   rootA ─ folder1 ─ folder2 ─ file1
//   rootB ─ folder3
//   outside ─ folder4 ─ file2
//   folder5 has two parents: outside and folder3
//   loop1 ↔ loop2 (a cycle, never reaching a root)
const tree: Record<string, string[]> = {
  rootA: ["myDrive"],
  rootB: ["myDrive"],
  folder1: ["rootA"],
  folder2: ["folder1"],
  file1: ["folder2"],
  folder3: ["rootB"],
  folder4: ["outside"],
  file2: ["folder4"],
  folder5: ["outside", "folder3"],
  outside: ["myDrive"],
  loop1: ["loop2"],
  loop2: ["loop1"],
  myDrive: [],
};
const roots = new Set(["rootA", "rootB"]);

const stub = () => {
  const calls: string[] = [];
  const lookup: DriveParentsLookup = async (id) => {
    calls.push(id);
    return tree[id] ?? [];
  };
  return { calls, lookup };
};

const run = async () => {
  // A root is allowed without any lookup.
  {
    const { calls, lookup } = stub();
    assert.equal(await isWithinDriveRoots("rootA", roots, lookup), true);
    assert.deepEqual(calls, []);
  }

  // Descendants are allowed, one lookup per hop.
  {
    const { calls, lookup } = stub();
    assert.equal(await isWithinDriveRoots("file1", roots, lookup), true);
    assert.deepEqual(calls, ["file1", "folder2", "folder1"]);
  }
  assert.equal(await isWithinDriveRoots("folder3", roots, stub().lookup), true);

  // Any parent may lead to a root.
  assert.equal(await isWithinDriveRoots("folder5", roots, stub().lookup), true);

  // Items outside the roots, unknown IDs and cycles are refused.
  assert.equal(await isWithinDriveRoots("file2", roots, stub().lookup), false);
  assert.equal(
    await isWithinDriveRoots("outside", roots, stub().lookup),
    false,
  );
  assert.equal(
    await isWithinDriveRoots("unknown", roots, stub().lookup),
    false,
  );
  {
    const { calls, lookup } = stub();
    assert.equal(await isWithinDriveRoots("loop1", roots, lookup), false);
    assert.deepEqual(calls, ["loop1", "loop2"]);
  }

  // The depth limit counts parent hops: file1 is 3 hops below rootA.
  assert.equal(
    await isWithinDriveRoots("file1", roots, stub().lookup, 3),
    true,
  );
  assert.equal(
    await isWithinDriveRoots("file1", roots, stub().lookup, 2),
    false,
  );
  {
    const deep: Record<string, string[]> = { n0: ["rootA"] };
    for (let i = 1; i <= DRIVE_SCOPE_MAX_DEPTH; i++)
      deep[`n${i}`] = [`n${i - 1}`];
    const lookup: DriveParentsLookup = async (id) => deep[id] ?? [];
    const last = DRIVE_SCOPE_MAX_DEPTH - 1;
    assert.equal(await isWithinDriveRoots(`n${last}`, roots, lookup), true);
    assert.equal(
      await isWithinDriveRoots(`n${DRIVE_SCOPE_MAX_DEPTH}`, roots, lookup),
      false,
    );
  }

  // No roots configured: nothing is allowed.
  assert.equal(
    await isWithinDriveRoots("file1", new Set(), stub().lookup),
    false,
  );

  // Lookup errors propagate (the route turns them into a generic 500).
  await assert.rejects(
    isWithinDriveRoots("file1", roots, async () => {
      throw new Error("Drive unavailable");
    }),
  );

  // memoizeParentsLookup: one fetch per ID, seeded entries are not fetched.
  {
    const { calls, lookup } = stub();
    const memo = memoizeParentsLookup(lookup, [["file1", ["folder2"]]]);
    assert.deepEqual(await memo("file1"), ["folder2"]);
    assert.deepEqual(await memo("folder2"), ["folder1"]);
    assert.deepEqual(await memo("folder2"), ["folder1"]);
    assert.equal(await isWithinDriveRoots("file1", roots, memo), true);
    assert.deepEqual(calls, ["folder2", "folder1"]);
  }

  // isDriveId accepts Drive-shaped IDs only.
  assert.equal(isDriveId("1AbCdEfGhIjKlMnOpQrStUvWxYz_-012"), true);
  assert.equal(isDriveId("short"), false);
  assert.equal(isDriveId("abcdefghij' in parents or 'x"), false);
  assert.equal(isDriveId("abc/def/ghijkl"), false);
  assert.equal(isDriveId(null), false);
  assert.equal(isDriveId("a".repeat(201)), false);

  // isDriveItemAllowedFor: what the Drive proxy serves to whom.
  // Fake Drive (IDs are made up):
  //   wholeDrive ─ adultesTab ─ concert ─ score
  //              ─ otherFolder ─ otherFile
  //   shared has two parents: otherFolder and concert
  //   jeunesTab sits elsewhere in the Drive; stray is outside the whole Drive
  {
    const driveTree: Record<string, string[]> = {
      wholeDrive: ["myDrive"],
      adultesTab: ["wholeDrive"],
      concert: ["adultesTab"],
      score: ["concert"],
      otherFolder: ["wholeDrive"],
      otherFile: ["otherFolder"],
      shared: ["otherFolder", "concert"],
      jeunesTab: ["myDrive"],
      stray: ["elsewhere"],
      elsewhere: [],
      myDrive: [],
    };
    const rows: DriveRootRow[] = [
      { slug: DRIVE_ROOT_SLUG, folder_id: "wholeDrive" },
      { slug: "adultes", folder_id: "adultesTab" },
      { slug: "jeunes", folder_id: "jeunesTab" },
    ];
    const lookups: string[] = [];
    const allowed = (
      caller: DriveCaller | null,
      id: string,
      folders: readonly DriveRootRow[] = rows,
    ) =>
      isDriveItemAllowedFor(
        caller,
        id,
        folders,
        memoizeParentsLookup(async (item) => {
          lookups.push(item);
          return driveTree[item] ?? [];
        }),
      );
    // A signed-in caller whose role lookups are counted.
    const signedIn = (admin: boolean) => {
      const caller = {
        roleLookups: 0,
        isAdmin: async () => {
          caller.roleLookups++;
          return admin;
        },
      };
      return caller;
    };

    // A member reads the tab folders and what lies below them, with no role
    // lookup.
    for (const id of [
      "adultesTab",
      "concert",
      "score",
      "shared",
      "jeunesTab",
    ]) {
      const member = signedIn(false);
      assert.equal(await allowed(member, id), true, id);
      assert.equal(member.roleLookups, 0, id);
    }

    // A member never reads the whole-Drive root, nor what lies below it
    // outside the tabs.
    for (const id of [
      "wholeDrive",
      "otherFolder",
      "otherFile",
      "stray",
      "unknown",
    ]) {
      assert.equal(await allowed(signedIn(false), id), false, id);
    }

    // Admins and superadmins (isAdmin true) also read the whole Drive, but
    // nothing outside it.
    for (const id of ["wholeDrive", "otherFolder", "otherFile", "score"]) {
      assert.equal(await allowed(signedIn(true), id), true, id);
    }
    assert.equal(await allowed(signedIn(true), "stray"), false);

    // The admin check walks the same parents again from the request's cache:
    // each item is fetched once.
    lookups.length = 0;
    assert.equal(await allowed(signedIn(true), "otherFile"), true);
    assert.deepEqual(lookups, [
      "otherFile",
      "otherFolder",
      "wholeDrive",
      "myDrive",
    ]);

    // Without a session, nothing is allowed and nothing is looked up.
    lookups.length = 0;
    assert.equal(await allowed(null, "score"), false);
    assert.equal(await allowed(null, "adultesTab"), false);
    assert.equal(await allowed(null, "wholeDrive"), false);
    assert.deepEqual(lookups, []);

    // Without a whole-Drive row, admins get the tabs like everyone else.
    {
      const admin = signedIn(true);
      const tabsOnly = rows.filter((row) => row.slug !== DRIVE_ROOT_SLUG);
      assert.equal(await allowed(admin, "otherFile", tabsOnly), false);
      assert.equal(await allowed(admin, "score", tabsOnly), true);
      assert.equal(admin.roleLookups, 0);
    }

    // A role lookup that throws never allows: the error propagates.
    await assert.rejects(
      allowed(
        {
          isAdmin: async () => {
            throw new Error("profiles unavailable");
          },
        },
        "otherFolder",
      ),
    );

    // driveScopeRoots keeps the whole-Drive row apart and skips empty IDs.
    assert.deepEqual(
      driveScopeRoots([...rows, { slug: "orchestre", folder_id: "" }]),
      {
        tabs: new Set(["adultesTab", "jeunesTab"]),
        wholeDrive: new Set(["wholeDrive"]),
      },
    );
  }

  console.log("driveScope: all assertions passed");
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
