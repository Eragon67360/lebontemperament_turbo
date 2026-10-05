// The Drive index (drive_index_nodes, filled by the sync-drive-index edge
// function) as the admin's « Partitions et documents » reads it: flat rows
// in, a tree of roots → programmes → groups → documents out.
// Pure: no React, no network, so tree.test.ts runs under tsx.

/** The columns the admin reads (GET /api/drive-index); nothing else leaves the database. */
export const DRIVE_INDEX_COLUMNS =
  "drive_id, parent_drive_id, root_slug, kind, name, mime_type, size, modified_time, depth";

export interface DriveIndexNode {
  drive_id: string;
  parent_drive_id: string | null;
  root_slug: string;
  kind: string;
  name: string;
  mime_type: string | null;
  size: number | null;
  modified_time: string | null;
  depth: number;
}

/** A configured root (drive_folders), for its label and order. */
export interface DriveRootFolder {
  slug: string;
  label: string;
  display_order: number;
}

export interface DriveTree {
  byId: ReadonlyMap<string, DriveIndexNode>;
  /** Children of each folder, folders first, then by name (French, numbers in order). */
  children: ReadonlyMap<string, readonly DriveIndexNode[]>;
  /** The depth-0 nodes: one per readable root. */
  roots: readonly DriveIndexNode[];
}

const collator = new Intl.Collator("fr", {
  numeric: true,
  sensitivity: "base",
});

export const isFolder = (node: Pick<DriveIndexNode, "kind">) =>
  node.kind === "folder";

/** Folders before files, then by name the way a French reader sorts them (« 2 » before « 10 »). */
export function compareNodes(
  a: Pick<DriveIndexNode, "kind" | "name">,
  b: Pick<DriveIndexNode, "kind" | "name">,
): number {
  if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
  return collator.compare(a.name, b.name);
}

export function buildDriveTree(nodes: readonly DriveIndexNode[]): DriveTree {
  const byId = new Map<string, DriveIndexNode>();
  for (const node of nodes) byId.set(node.drive_id, node);

  const children = new Map<string, DriveIndexNode[]>();
  const roots: DriveIndexNode[] = [];
  for (const node of byId.values()) {
    // A node whose parent is gone from the live index (removed between two
    // syncs) has nowhere to hang: it is left out rather than shown at the top.
    if (node.parent_drive_id === null) {
      if (node.depth === 0) roots.push(node);
      continue;
    }
    const list = children.get(node.parent_drive_id) ?? [];
    list.push(node);
    children.set(node.parent_drive_id, list);
  }
  for (const list of children.values()) list.sort(compareNodes);
  roots.sort(compareNodes);

  return { byId, children, roots };
}

export function childrenOf(
  tree: DriveTree,
  folderId: string,
): readonly DriveIndexNode[] {
  return tree.children.get(folderId) ?? [];
}

export interface FolderStats {
  /** Sub-folders at any depth. */
  folders: number;
  /** Files at any depth. */
  documents: number;
  /** Most recent modified time among the files below, ISO; null when none has one. */
  lastModified: string | null;
}

/** Counts everything below a folder (cycles cannot occur in Drive, but are guarded anyway). */
export function folderStats(tree: DriveTree, folderId: string): FolderStats {
  const stats: FolderStats = { folders: 0, documents: 0, lastModified: null };
  const seen = new Set<string>([folderId]);
  const stack = [folderId];
  while (stack.length > 0) {
    for (const child of childrenOf(tree, stack.pop()!)) {
      if (seen.has(child.drive_id)) continue;
      seen.add(child.drive_id);
      if (isFolder(child)) {
        stats.folders += 1;
        stack.push(child.drive_id);
      } else {
        stats.documents += 1;
        if (
          child.modified_time &&
          (!stats.lastModified ||
            Date.parse(child.modified_time) > Date.parse(stats.lastModified))
        ) {
          stats.lastModified = child.modified_time;
        }
      }
    }
  }
  return stats;
}

export interface RootSection {
  root: DriveIndexNode;
  /** The drive_folders label (« Adultes »); the Drive folder's name when the row is unknown. */
  label: string;
  /** The root's folders: the programmes. */
  programmes: readonly DriveIndexNode[];
  /** Files lying directly in the root. */
  documents: readonly DriveIndexNode[];
}

/**
 * One section per indexed root, in the members site's order (drive_folders
 * display_order; unknown slugs last, by name). The « racine » root comes
 * last whatever its order: the members site shows it as a link, not a tab,
 * and its index holds only what the other roots don't.
 */
export function rootSections(
  tree: DriveTree,
  folders: readonly DriveRootFolder[] = [],
  rootSlug = "racine",
): RootSection[] {
  const bySlug = new Map(folders.map((f) => [f.slug, f]));
  const rank = (node: DriveIndexNode) => {
    if (node.root_slug === rootSlug) return Number.MAX_SAFE_INTEGER;
    return (
      bySlug.get(node.root_slug)?.display_order ?? Number.MAX_SAFE_INTEGER - 1
    );
  };

  return [...tree.roots]
    .sort((a, b) => rank(a) - rank(b) || compareNodes(a, b))
    .map((root) => {
      const children = childrenOf(tree, root.drive_id);
      return {
        root,
        label: bySlug.get(root.root_slug)?.label ?? root.name,
        programmes: children.filter(isFolder),
        documents: children.filter((child) => !isFolder(child)),
      };
    });
}

/** The chain from the root down to `id` (both included); [] when `id` is not indexed. */
export function ancestry(tree: DriveTree, id: string): DriveIndexNode[] {
  const chain: DriveIndexNode[] = [];
  const seen = new Set<string>();
  let current = tree.byId.get(id);
  while (current && !seen.has(current.drive_id)) {
    seen.add(current.drive_id);
    chain.unshift(current);
    current = current.parent_drive_id
      ? tree.byId.get(current.parent_drive_id)
      : undefined;
  }
  return chain;
}

/** True when `id` lies strictly below the folder `ancestorId`. */
export function isBelow(tree: DriveTree, ancestorId: string, id: string) {
  return ancestry(tree, id)
    .slice(0, -1)
    .some((node) => node.drive_id === ancestorId);
}

export interface DocumentGroup {
  /** The folder holding these documents. */
  folder: DriveIndexNode;
  /** Its names below the group (« Audio / Pupitres »); [] for the group itself. */
  trail: string[];
  documents: DriveIndexNode[];
}

/**
 * Every document under a group, folder by folder: the group's own files
 * first, then each sub-folder depth-first in display order. Folders without
 * files are left out (their files' folders still carry the full trail).
 */
export function documentsByFolder(
  tree: DriveTree,
  groupId: string,
): DocumentGroup[] {
  const group = tree.byId.get(groupId);
  if (!group) return [];

  const out: DocumentGroup[] = [];
  const seen = new Set<string>();
  const visit = (folder: DriveIndexNode, trail: string[]) => {
    if (seen.has(folder.drive_id)) return;
    seen.add(folder.drive_id);
    const children = childrenOf(tree, folder.drive_id);
    const documents = children.filter((child) => !isFolder(child));
    if (documents.length > 0) out.push({ folder, trail, documents });
    for (const child of children) {
      if (isFolder(child)) visit(child, [...trail, child.name]);
    }
  };
  visit(group, []);
  return out;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The `[programId]` segment of /dashboard/members/travail/… is either a
 * Drive folder ID (the index) or, for the old Storage explorer, a `programs`
 * row's UUID. Drive IDs never have the UUID shape, so the shape decides.
 */
export const isLegacyProgramId = (id: string) => UUID.test(id);
