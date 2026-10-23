// Pure part of purge-order-documents: which object names may be removed and
// in what batches. Unit-tested in plan_test.ts.

/** `<order id>/<file>`: the only shape the bucket's upload policy allows. */
const ORDER_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^/]+$/i;

/** The names that look like an order's file; anything else is left alone. */
export function orderFilePaths(names: readonly unknown[]): string[] {
  return names.filter(
    (name): name is string =>
      typeof name === "string" && ORDER_FILE.test(name) && !name.includes(".."),
  );
}

/** The Storage API removes at most a thousand objects per call; 100 is plenty. */
export function batches<T>(items: readonly T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
