// Pure parts of the Drive index sync: the walk planner, the path builder and
// the diff. No Deno globals, no network, no database: the reader is injected,
// so the module runs under Deno (plan_test.ts) and under Node alike.

export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";
export const PATH_SEPARATOR = " / ";

/** Hard limits of one run; exceeding one fails the run instead of truncating. */
export interface WalkCaps {
  /** Root folders are depth 0; a folder at this depth must be empty. */
  maxDepth: number;
  /** Folders and files together, over every readable root. */
  maxNodes: number;
}

export const DEFAULT_CAPS: WalkCaps = { maxDepth: 8, maxNodes: 5000 };

/** A file or folder as `files.list` / `files.get` return it. */
export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  md5Checksum?: string;
  parents?: string[];
};

/** One row of `drive_folders`. */
export type RootFolder = {
  slug: string;
  folder_id: string;
  display_order?: number;
};

export type NodeKind = "folder" | "file";

/** A node of the walk, shaped like a `drive_index_nodes` row. (Type aliases, not
 * interfaces, for the JSON shapes: supabase-js needs them assignable to
 * Record<string, unknown>.) */
export type IndexNode = {
  drive_id: string;
  parent_drive_id: string | null;
  root_slug: string;
  kind: NodeKind;
  name: string;
  mime_type: string | null;
  size: number | null;
  modified_time: string | null;
  md5_checksum: string | null;
  path: string;
  depth: number;
};

/** What the diff needs from the rows already in `drive_index_nodes`. */
export type ExistingNode = {
  drive_id: string;
  parent_drive_id: string | null;
  root_slug: string;
  kind: NodeKind;
  name: string;
  path: string;
  removed_at: string | null;
};

/** Google refused or could not serve a request (403, 404, 5xx, network). */
export class DriveAccessError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DriveAccessError";
    this.status = status;
  }
}

/** A cap was exceeded: the run must stop and say so. */
export class WalkLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalkLimitError";
  }
}

export interface DriveReader {
  /** Metadata of one folder; throws DriveAccessError when it can't be read. */
  getFolder(id: string): Promise<DriveItem>;
  /** Every direct child (all pages), trashed items excluded. */
  listChildren(folderId: string): Promise<DriveItem[]>;
}

export type UnreadableRoot = {
  slug: string;
  reason: string;
};

export interface WalkResult {
  nodes: IndexNode[];
  /** Roots that were walked completely; their missing nodes are removals. */
  readableRootSlugs: string[];
  /** Roots left untouched because the service account couldn't read them. */
  unreadableRoots: UnreadableRoot[];
}

export interface WalkOptions {
  caps?: WalkCaps;
  /** Folder listings in flight at once within one level. */
  concurrency?: number;
  log?: (event: string, data?: Record<string, unknown>) => void;
}

/** Names from the root down, joined by " / ". */
export function joinPath(parentPath: string | null, name: string): string {
  return parentPath ? `${parentPath}${PATH_SEPARATOR}${name}` : name;
}

/** Shortcuts are files with their own mime type; only real folders are walked. */
export function kindOf(mimeType: string | undefined): NodeKind {
  return mimeType === FOLDER_MIME ? "folder" : "file";
}

export function toIndexNode(
  item: DriveItem,
  rootSlug: string,
  parentDriveId: string | null,
  parentPath: string | null,
  depth: number,
): IndexNode {
  const size =
    item.size !== undefined && item.size !== "" ? Number(item.size) : null;
  return {
    drive_id: item.id,
    parent_drive_id: parentDriveId,
    root_slug: rootSlug,
    kind: kindOf(item.mimeType),
    name: item.name,
    mime_type: item.mimeType ?? null,
    size: size !== null && Number.isFinite(size) ? size : null,
    modified_time: item.modifiedTime ?? null,
    md5_checksum: item.md5Checksum ?? null,
    path: joinPath(parentPath, item.name),
    depth,
  };
}

/**
 * Runs `worker` over `items` with at most `limit` calls in flight, in input
 * order, and rejects on the first failure.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("concurrency limit must be a positive integer.");
  }
  const results = new Array<R>(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

interface PendingFolder {
  id: string;
  path: string;
  depth: number;
}

/**
 * Walks every root breadth-first and returns the nodes it saw.
 *
 * - Roots are walked in `display_order`. A node already seen under an earlier
 *   root is not recorded again, and a folder that is itself a configured root
 *   is never entered from another root: `racine` (the whole Drive) contains
 *   the other roots, and each node belongs to the most specific root.
 * - A root the service account can't read (or whose listing fails midway)
 *   is reported in `unreadableRoots`; none of its nodes are returned, so the
 *   diff leaves its existing rows untouched.
 * - Exceeding a cap throws WalkLimitError: the run fails rather than
 *   recording a partial tree as the truth.
 */
export async function walkRoots(
  roots: readonly RootFolder[],
  reader: DriveReader,
  options: WalkOptions = {},
): Promise<WalkResult> {
  const caps = options.caps ?? DEFAULT_CAPS;
  const concurrency = options.concurrency ?? 4;
  const log = options.log ?? (() => {});

  const ordered = [...roots].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  const rootIds = new Set(ordered.map((root) => root.folder_id));
  const seen = new Set<string>();
  const nodes: IndexNode[] = [];
  const readableRootSlugs: string[] = [];
  const unreadableRoots: UnreadableRoot[] = [];

  for (const root of ordered) {
    if (seen.has(root.folder_id)) {
      // Two slugs point at the same folder: the first one owns it.
      log("root_duplicate", { slug: root.slug });
      readableRootSlugs.push(root.slug);
      continue;
    }

    const rootNodes: IndexNode[] = [];
    const rootSeen = new Set<string>();

    try {
      const folder = await reader.getFolder(root.folder_id);
      if (kindOf(folder.mimeType) !== "folder") {
        throw new DriveAccessError(
          400,
          `L'identifiant du dossier « ${root.slug} » ne désigne pas un dossier.`,
        );
      }

      rootSeen.add(folder.id);
      rootNodes.push(toIndexNode(folder, root.slug, null, null, 0));
      let level: PendingFolder[] = [
        { id: folder.id, path: folder.name, depth: 0 },
      ];

      while (level.length > 0) {
        const listings = await mapWithConcurrency(level, concurrency, (f) =>
          reader.listChildren(f.id),
        );
        const nextLevel: PendingFolder[] = [];

        level.forEach((parent, index) => {
          const children = listings[index];
          if (children.length > 0 && parent.depth >= caps.maxDepth) {
            throw new WalkLimitError(
              `Le dossier « ${parent.path} » dépasse la profondeur maximale (${caps.maxDepth} niveaux).`,
            );
          }
          for (const child of children) {
            if (seen.has(child.id) || rootSeen.has(child.id)) continue;
            if (rootIds.has(child.id)) {
              log("nested_root_skipped", {
                slug: root.slug,
                nested_id: child.id,
              });
              continue;
            }
            rootSeen.add(child.id);
            const node = toIndexNode(
              child,
              root.slug,
              parent.id,
              parent.path,
              parent.depth + 1,
            );
            rootNodes.push(node);
            if (nodes.length + rootNodes.length > caps.maxNodes) {
              throw new WalkLimitError(
                `Plus de ${caps.maxNodes} éléments sous les dossiers Drive : la synchronisation s'arrête.`,
              );
            }
            if (node.kind === "folder") {
              nextLevel.push({
                id: child.id,
                path: node.path,
                depth: node.depth,
              });
            }
          }
        });

        level = nextLevel;
      }
    } catch (error) {
      if (error instanceof WalkLimitError) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      log("root_unreadable", { slug: root.slug, reason });
      unreadableRoots.push({ slug: root.slug, reason });
      continue;
    }

    for (const id of rootSeen) seen.add(id);
    nodes.push(...rootNodes);
    readableRootSlugs.push(root.slug);
    log("root_walked", { slug: root.slug, nodes: rootNodes.length });
  }

  return { nodes, readableRootSlugs, unreadableRoots };
}

export type DiffEntry = {
  kind: NodeKind;
  name: string;
  path: string;
  previous_name?: string;
  previous_path?: string;
};

export type DiffCounts = {
  added: number;
  renamed: number;
  moved: number;
  removed: number;
  unchanged: number;
  unreadable_roots: number;
};

export interface IndexDiff {
  added: DiffEntry[];
  renamed: DiffEntry[];
  moved: DiffEntry[];
  removed: DiffEntry[];
  unreadable_roots: UnreadableRoot[];
  counts: DiffCounts;
  /** Drive IDs to soft-delete on apply. */
  removeIds: string[];
}

function entryOf(node: {
  kind: NodeKind;
  name: string;
  path: string;
}): DiffEntry {
  return { kind: node.kind, name: node.name, path: node.path };
}

/**
 * Compares a walk with the current index. A node is "moved" when its parent
 * or root changed (even if renamed too), "renamed" when only its name did,
 * "added" when unknown or previously removed. Rows under an unreadable root
 * are neither counted nor removed.
 */
export function diffIndex(
  walk: WalkResult,
  existing: readonly ExistingNode[],
): IndexDiff {
  const existingById = new Map(existing.map((row) => [row.drive_id, row]));
  const walkedIds = new Set(walk.nodes.map((node) => node.drive_id));
  const readable = new Set(walk.readableRootSlugs);

  const added: DiffEntry[] = [];
  const renamed: DiffEntry[] = [];
  const moved: DiffEntry[] = [];
  const removed: DiffEntry[] = [];
  const removeIds: string[] = [];
  let unchanged = 0;

  for (const node of walk.nodes) {
    const before = existingById.get(node.drive_id);
    if (!before || before.removed_at) {
      added.push(entryOf(node));
    } else if (
      before.parent_drive_id !== node.parent_drive_id ||
      before.root_slug !== node.root_slug
    ) {
      moved.push({
        ...entryOf(node),
        previous_name: before.name,
        previous_path: before.path,
      });
    } else if (before.name !== node.name) {
      renamed.push({
        ...entryOf(node),
        previous_name: before.name,
        previous_path: before.path,
      });
    } else {
      unchanged++;
    }
  }

  for (const row of existing) {
    if (row.removed_at) continue;
    if (!readable.has(row.root_slug)) continue;
    if (walkedIds.has(row.drive_id)) continue;
    removed.push(entryOf(row));
    removeIds.push(row.drive_id);
  }

  return {
    added,
    renamed,
    moved,
    removed,
    unreadable_roots: walk.unreadableRoots,
    removeIds,
    counts: {
      added: added.length,
      renamed: renamed.length,
      moved: moved.length,
      removed: removed.length,
      unchanged,
      unreadable_roots: walk.unreadableRoots.length,
    },
  };
}

export const RUN_DIFF_CAP = 200;

export type RunDiff = {
  added: DiffEntry[];
  renamed: DiffEntry[];
  moved: DiffEntry[];
  removed: DiffEntry[];
  unreadable_roots: UnreadableRoot[];
  /** Groups longer than the cap, with their full length. */
  truncated: Partial<Record<"added" | "renamed" | "moved" | "removed", number>>;
};

/** The diff as stored in `drive_sync_runs.diff`: names and paths, capped. */
export function toRunDiff(diff: IndexDiff, cap = RUN_DIFF_CAP): RunDiff {
  const truncated: RunDiff["truncated"] = {};
  const take = (
    group: "added" | "renamed" | "moved" | "removed",
  ): DiffEntry[] => {
    const entries = diff[group];
    if (entries.length > cap) truncated[group] = entries.length;
    return entries.slice(0, cap);
  };
  return {
    added: take("added"),
    renamed: take("renamed"),
    moved: take("moved"),
    removed: take("removed"),
    unreadable_roots: diff.unreadable_roots,
    truncated,
  };
}

/** Removal limits for an automatic (cron) apply, per root. */
export type RemovalLimits = {
  /** Removals above this share of a root's live nodes are refused. */
  maxRatio: number;
  /** Removals above this absolute count are refused. */
  maxCount: number;
};

export const CRON_REMOVAL_LIMITS: RemovalLimits = {
  maxRatio: 0.2,
  maxCount: 50,
};

export const CRON_REMOVALS_REFUSED =
  "Trop de retraits pour une synchronisation automatique : vérifiez dans l'admin";

export type ApplyPlan = {
  nodes: IndexNode[];
  removeIds: string[];
  /** Roots left untouched because the cron limits were exceeded. */
  blockedRoots: string[];
  status: "success" | "error";
  error: string | null;
};

/**
 * What an apply may write. An admin apply (confirmed in the UI) writes the
 * whole diff. A cron apply refuses a root whose removals exceed the limits
 * (a mass "removal" is more likely a moved or unshared folder than real
 * deletions): that root is left untouched, the others are applied, and the
 * run is recorded as an error so somebody looks at it in the admin.
 */
export function planApply(
  walk: WalkResult,
  diff: IndexDiff,
  existing: readonly ExistingNode[],
  trigger: "cron" | "admin",
  limits: RemovalLimits = CRON_REMOVAL_LIMITS,
): ApplyPlan {
  if (trigger === "admin") {
    return {
      nodes: walk.nodes,
      removeIds: diff.removeIds,
      blockedRoots: [],
      status: "success",
      error: null,
    };
  }

  const liveByRoot = new Map<string, number>();
  for (const row of existing) {
    if (row.removed_at) continue;
    liveByRoot.set(row.root_slug, (liveByRoot.get(row.root_slug) ?? 0) + 1);
  }
  const rootOf = new Map(existing.map((row) => [row.drive_id, row.root_slug]));
  const removedByRoot = new Map<string, number>();
  for (const id of diff.removeIds) {
    const slug = rootOf.get(id);
    if (!slug) continue;
    removedByRoot.set(slug, (removedByRoot.get(slug) ?? 0) + 1);
  }

  const blocked = new Set<string>();
  for (const [slug, removed] of removedByRoot) {
    const live = liveByRoot.get(slug) ?? 0;
    if (removed > limits.maxCount || removed > limits.maxRatio * live) {
      blocked.add(slug);
    }
  }

  if (blocked.size === 0) {
    return {
      nodes: walk.nodes,
      removeIds: diff.removeIds,
      blockedRoots: [],
      status: "success",
      error: null,
    };
  }

  const blockedRoots = [...blocked].sort();
  return {
    nodes: walk.nodes.filter((node) => !blocked.has(node.root_slug)),
    removeIds: diff.removeIds.filter(
      (id) => !blocked.has(rootOf.get(id) ?? ""),
    ),
    blockedRoots,
    status: "error",
    error: `${CRON_REMOVALS_REFUSED} (${blockedRoots.join(", ")}).`,
  };
}

export type FailureCode =
  "limit" | "google_auth" | "drive" | "database" | "config" | "internal";

export type Failure = {
  code: FailureCode;
  /** Plain French, safe to show to an admin. */
  message: string;
  /** The technical detail, for the function's logs only. */
  detail: string;
};

/** Turns any thrown error into a code and a plain French message. */
export function describeFailure(error: unknown): Failure {
  const detail = error instanceof Error ? error.message : String(error);
  if (error instanceof WalkLimitError) {
    return { code: "limit", message: detail, detail };
  }
  if (error instanceof DriveAccessError) {
    return {
      code: "drive",
      message:
        "Google Drive n'a pas répondu correctement. Réessayez plus tard.",
      detail,
    };
  }
  if (/environment variable/i.test(detail)) {
    return {
      code: "config",
      message: "La fonction de synchronisation n'est pas configurée.",
      detail,
    };
  }
  if (/google token|service_account|client_email|private_key/i.test(detail)) {
    return {
      code: "google_auth",
      message:
        "Le compte de service n'a pas pu s'authentifier auprès de Google. Vérifiez sa clé et l'activation de l'API Drive.",
      detail,
    };
  }
  if (
    /^(drive_folders|drive_index_nodes|drive_sync_runs|drive_index_apply):/.test(
      detail,
    )
  ) {
    return {
      code: "database",
      message:
        "La base de données a refusé l'opération. Le détail est dans les journaux de la fonction.",
      detail,
    };
  }
  return {
    code: "internal",
    message:
      "La synchronisation a échoué. Le détail est dans les journaux de la fonction.",
    detail,
  };
}
