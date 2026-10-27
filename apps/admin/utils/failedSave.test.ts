// After the request that should have saved a row for an uploaded file
// fails: the file is removed only once the server's list says that no row
// points at it. Fake keys only.
import assert from "node:assert/strict";
import { failedSaveOutcome, settleFailedSave } from "./failedSave";

const EVENT = "7f2a1c3e-5b6d-4e8f-9a0b-1c2d3e4f5a6b";
const KEY = `events/${EVENT}/5f0c2c4e-8f53-4a3b-9b8e-2d0f1a7c6b55-Bulletin.pdf`;
const OTHER = `events/${EVENT}/0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d-Programme.pdf`;

// --- The decision ---

// The save failed but the row exists (its answer was lost): keep the file.
assert.equal(failedSaveOutcome(KEY, [KEY]), "saved");
assert.equal(failedSaveOutcome(KEY, [OTHER, KEY]), "saved");

// The save failed and no row points at the file: remove it.
assert.equal(failedSaveOutcome(KEY, []), "orphan");
assert.equal(failedSaveOutcome(KEY, [OTHER]), "orphan");

// The list couldn't be read: nobody knows, the file stays.
assert.equal(failedSaveOutcome(KEY, null), "unknown");

// An exact key, never a prefix or a case-insensitive match.
assert.equal(failedSaveOutcome(KEY, [`${KEY}.bak`]), "orphan");
assert.equal(failedSaveOutcome(KEY, [KEY.toUpperCase()]), "orphan");

// --- The settlement: the file is removed for an orphan only ---

const settle = (
  keys: () => Promise<readonly string[]>,
  remove: () => Promise<unknown> = async () => undefined,
) =>
  settleFailedSave({
    storageKey: KEY,
    readSavedKeys: keys,
    removeFile: remove,
  });

{
  let removed = 0;
  const outcome = await settle(
    async () => [OTHER, KEY],
    async () => void removed++,
  );
  assert.equal(outcome, "saved");
  assert.equal(removed, 0);
}
{
  let removed = 0;
  const outcome = await settle(
    async () => [OTHER],
    async () => void removed++,
  );
  assert.equal(outcome, "orphan");
  assert.equal(removed, 1);
}
{
  // The list can't be read (still no network): kept, nothing removed.
  let removed = 0;
  const outcome = await settle(
    async () => {
      throw new TypeError("Failed to fetch");
    },
    async () => void removed++,
  );
  assert.equal(outcome, "unknown");
  assert.equal(removed, 0);
}
{
  // A removal that fails doesn't fail the caller: the orphan stays behind.
  const outcome = await settle(
    async () => [],
    async () => {
      throw new Error("storage down");
    },
  );
  assert.equal(outcome, "orphan");
}

console.log("utils/failedSave: all assertions passed");
