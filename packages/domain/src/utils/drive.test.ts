import assert from "node:assert/strict";
import { driveFolderUrl, extractDriveFolderId } from "./drive";

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

console.log("extractDriveFolderId: all assertions passed");
