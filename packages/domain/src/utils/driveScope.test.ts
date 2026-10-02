import assert from "node:assert/strict";
import {
  DRIVE_SCOPE_MAX_DEPTH,
  isDriveId,
  isWithinDriveRoots,
  memoizeParentsLookup,
  type DriveParentsLookup,
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

  console.log("isWithinDriveRoots: all assertions passed");
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
