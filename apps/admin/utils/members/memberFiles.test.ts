import assert from "node:assert/strict";
import { test } from "node:test";
import { profilePictureFilesOf } from "./memberFiles";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "11111111-1111-4111-8111-111111111112";

test("only the member's own profile pictures are removed", () => {
  assert.deepEqual(
    profilePictureFilesOf(ME, [
      `${ME}_1700000000000.jpg`,
      `${OTHER}_1700000000000.jpg`,
      `x${ME}_1.png`,
      `${ME}.png`,
      `${ME}_1800000000000.webp`,
    ]),
    [`${ME}_1700000000000.jpg`, `${ME}_1800000000000.webp`],
  );
});
