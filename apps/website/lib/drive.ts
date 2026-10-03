import "server-only";

import type { Database } from "@repo/domain/database.types";
import {
  isWithinDriveRoots,
  memoizeParentsLookup,
  type DriveParentsLookup,
} from "@repo/domain/utils/driveScope";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * True when the Drive item is one of the folders configured in `drive_folders`
 * (read as the caller) or lies below one of them. `knownParents` seeds the
 * per-request lookup cache with parents the route already fetched.
 */
export async function isDriveItemAllowed(
  drive: drive_v3.Drive,
  supabase: SupabaseClient<Database>,
  id: string,
  knownParents: Iterable<readonly [string, readonly string[]]> = [],
): Promise<boolean> {
  const { data, error } = await supabase
    .from("drive_folders")
    .select("folder_id");
  if (error) throw error;

  const roots = new Set(data.map((row) => row.folder_id).filter(Boolean));
  return isWithinDriveRoots(
    id,
    roots,
    memoizeParentsLookup(driveParentsLookup(drive), knownParents),
  );
}
