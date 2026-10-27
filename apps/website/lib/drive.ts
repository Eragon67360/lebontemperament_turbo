import "server-only";

import { isAdmin } from "@/utils/auth";
import type { Database } from "@repo/domain/database.types";
import {
  isDriveItemAllowedFor,
  memoizeParentsLookup,
  type DriveCaller,
  type DriveParentsLookup,
  type DriveRootRow,
} from "@repo/domain/utils/driveScope";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { google, type drive_v3 } from "googleapis";

/** Drive client acting with the association's Google account. */
export function getDriveClient(): drive_v3.Drive {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth2 credentials");
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground",
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oAuth2Client });
}

const httpStatus = (error: unknown): number | undefined => {
  if (error === null || typeof error !== "object") return undefined;
  const { status, response } = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof status === "number") return status;
  return typeof response?.status === "number" ? response.status : undefined;
};

/** True when Drive answered that the item doesn't exist (or isn't visible). */
export const isDriveNotFound = (error: unknown) => httpStatus(error) === 404;

/** Parent lookup against the Drive API; unknown items have no parents. */
function driveParentsLookup(drive: drive_v3.Drive): DriveParentsLookup {
  return async (id) => {
    try {
      const { data } = await drive.files.get({
        fileId: id,
        fields: "parents",
        supportsAllDrives: true,
      });
      return data.parents ?? [];
    } catch (error) {
      if (isDriveNotFound(error)) return [];
      throw error;
    }
  };
}

/** How long a server instance reuses its copy of the `drive_folders` roots. */
const DRIVE_ROOTS_TTL_MS = 60_000;

/**
 * The last `drive_folders` read. Every signed-in user reads the same rows,
 * so one copy serves every caller; who gets which root is decided per caller.
 */
let driveRootsCache: { rows: DriveRootRow[]; expiresAt: number } | undefined;

/** Reads the roots from `drive_folders` (as the caller) and keeps a copy. */
async function readDriveRoots(
  supabase: SupabaseClient<Database>,
): Promise<DriveRootRow[]> {
  const { data, error } = await supabase
    .from("drive_folders")
    .select("slug, folder_id");
  if (error) throw error;

  driveRootsCache = { rows: data, expiresAt: Date.now() + DRIVE_ROOTS_TTL_MS };
  return data;
}

/** The signed-in caller, as `checkAuthorization` returns them. */
export interface DriveProxyCaller {
  /** Client acting as the caller, so row-level security applies. */
  supabase: SupabaseClient<Database>;
  user: Pick<User, "id">;
}

/**
 * True when the caller may read the Drive item: the tab folders configured in
 * `drive_folders`, and what lies below them, for every member; the whole Drive
 * (the `racine` row) for admins and superadmins only. `knownParents` seeds the
 * per-request lookup cache with parents the route already fetched.
 *
 * The roots come from a copy at most a minute old; when that copy refuses the
 * item, the table is read again, so a folder an admin has just retargeted
 * opens at once.
 */
export async function isDriveItemAllowed(
  drive: drive_v3.Drive,
  caller: DriveProxyCaller,
  id: string,
  knownParents: Iterable<readonly [string, readonly string[]]> = [],
): Promise<boolean> {
  const getParents = memoizeParentsLookup(
    driveParentsLookup(drive),
    knownParents,
  );
  // The role is read at most once per request, and only when needed.
  let roleCheck: Promise<boolean> | undefined;
  const scopeCaller: DriveCaller = {
    isAdmin: () => (roleCheck ??= isAdmin(caller.supabase, caller.user.id)),
  };
  const allows = (rows: readonly DriveRootRow[]) =>
    isDriveItemAllowedFor(scopeCaller, id, rows, getParents);

  const cached =
    driveRootsCache && driveRootsCache.expiresAt > Date.now()
      ? driveRootsCache.rows
      : undefined;
  if (cached && (await allows(cached))) {
    return true;
  }
  return allows(await readDriveRoots(caller.supabase));
}
