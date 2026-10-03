/**
 * Access scoping for Google Drive items served by the website: an item may be
 * read only if it is one of the configured root folders (`drive_folders`) or
 * lies below one of them.
 */

const DRIVE_ID = /^[A-Za-z0-9_-]{10,200}$/;

/** True for a string shaped like a Drive file or folder ID. */
export const isDriveId = (value: unknown): value is string =>
  typeof value === "string" && DRIVE_ID.test(value);

/**
 * Returns the parent IDs of a Drive item, or [] when it has none or cannot be
 * seen (deleted, not shared with the account, unknown ID).
 */
export type DriveParentsLookup = (id: string) => Promise<readonly string[]>;

/**
 * How many `parents` hops the check follows before giving up. The members'
 * tree was 6 levels deep (files included) when this was written; items deeper
 * than this are refused.
 */
export const DRIVE_SCOPE_MAX_DEPTH = 8;

/**
 * Wraps a parents lookup so each ID is fetched at most once for the lifetime of
 * the returned function (create one per request). `known` seeds it with parents
 * already fetched, e.g. from a metadata call.
 */
export const memoizeParentsLookup = (
  lookup: DriveParentsLookup,
  known: Iterable<readonly [string, readonly string[]]> = [],
): DriveParentsLookup => {
  const cache = new Map<string, Promise<readonly string[]>>();
  for (const [id, parents] of known) {
    cache.set(id, Promise.resolve(parents));
  }
  return (id) => {
    let parents = cache.get(id);
    if (!parents) {
      parents = lookup(id);
      cache.set(id, parents);
    }
    return parents;
  };
};

/**
 * True when `id` is one of `roots` or lies below one of them, following Drive
 * `parents` links at most `maxDepth` hops up (every parent is followed, for
 * items with several). Lookup errors propagate to the caller.
 */
export const isWithinDriveRoots = async (
  id: string,
  roots: ReadonlySet<string>,
  getParents: DriveParentsLookup,
  maxDepth: number = DRIVE_SCOPE_MAX_DEPTH,
): Promise<boolean> => {
  if (roots.has(id)) {
    return true;
  }

  const seen = new Set<string>([id]);
  let frontier = [id];

  for (let hop = 1; hop <= maxDepth && frontier.length > 0; hop++) {
    const parentLists = await Promise.all(frontier.map(getParents));
    const next: string[] = [];
    for (const parents of parentLists) {
      for (const parent of parents) {
        if (roots.has(parent)) {
          return true;
        }
        if (!seen.has(parent)) {
          seen.add(parent);
          next.push(parent);
        }
      }
    }
    frontier = next;
  }

  return false;
};
