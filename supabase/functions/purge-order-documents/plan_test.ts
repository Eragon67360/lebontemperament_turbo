import { assertEquals } from "jsr:@std/assert@1";

import { batches, orderFilePaths } from "./plan.ts";

const ID = "9fa48563-0afc-4ef6-85d2-2e4b8552ecfc";

Deno.test("orderFilePaths keeps <order id>/<file> only", () => {
  assertEquals(
    orderFilePaths([
      `${ID}/abc-bon.pdf`,
      `${ID}/sub/x.pdf`,
      `${ID}/..pdf`,
      "events/x.pdf",
      "x.pdf",
      42,
      null,
    ]),
    [`${ID}/abc-bon.pdf`],
  );
});

Deno.test("batches splits by size and keeps the order", () => {
  assertEquals(batches([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assertEquals(batches([], 2), []);
});
