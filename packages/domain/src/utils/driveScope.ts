/**
 * Access scoping for Google Drive items served by the website: an item may be
 * read only if it is one of the configured root folders (`drive_folders`) or
 * lies below one of them. The whole-Drive row (`racine`) is a root for admins
 * only; members get the tab folders.
 */

import { DRIVE_ROOT_SLUG } from "./drive";

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

/** A `drive_folders` row, as the scope check reads it. */
export interface DriveRootRow {
  slug: string;
  folder_id: string;
}

/**
 * Splits the `drive_folders` rows into the tab folders, which every member
 * browses, and the whole-Drive root (`racine`), which only admins may read.
 * Rows without a folder ID are left out.
 */
export const driveScopeRoots = (
  rows: readonly DriveRootRow[],
): { tabs: Set<string>; wholeDrive: Set<string> } => {
  const tabs = new Set<string>();
  const wholeDrive = new Set<string>();
  for (const row of rows) {
    if (!row.folder_id) continue;
    (row.slug === DRIVE_ROOT_SLUG ? wholeDrive : tabs).add(row.folder_id);
  }
  return { tabs, wholeDrive };
};

/** The signed-in caller of the Drive proxy. */
export interface DriveCaller {
  /** True for an admin or a superadmin. */
  isAdmin: () => Promise<boolean>;
}

/**
 * True when `caller` may read the Drive item `id` through the website's
 * proxy: every signed-in member reads the tab folders and what lies below
 * them; admins and superadmins also read the whole Drive (`racine`). Without
 * a caller (no session), nothing.
 *
 * `isAdmin` is only asked when the tabs don't already allow the item, so a
 * member's usual request costs no role lookup. Pass a memoized `getParents`
 * (`memoizeParentsLookup`): the admin check walks the same parents again.
 */
export const isDriveItemAllowedFor = async (
  caller: DriveCaller | null,
  id: string,
  rows: readonly DriveRootRow[],
  getParents: DriveParentsLookup,
): Promise<boolean> => {
  if (!caller) {
    return false;
  }
  const { tabs, wholeDrive } = driveScopeRoots(rows);
  if (await isWithinDriveRoots(id, tabs, getParents)) {
    return true;
  }
  if (wholeDrive.size === 0 || !(await caller.isAdmin())) {
    return false;
  }
  return isWithinDriveRoots(id, wholeDrive, getParents);
};
