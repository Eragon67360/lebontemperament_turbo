import { getDriveClient, isDriveItemAllowed } from "@/lib/drive";
import { checkAuthorization } from "@/utils/auth";
import {
  DRIVE_LIST_MAX_ITEMS,
  listAllDrivePages,
} from "@repo/domain/utils/driveDownload";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { NextRequest, NextResponse } from "next/server";

/** Items fetched per Drive call (Drive allows up to 1000). */
const PAGE_SIZE = 200;

/**
 * Lists a Drive folder for the members area and the mobile app.
 * Only folders configured in `drive_folders`, or below them, can be listed.
 *
 * GET /api/drive/files?folderID=xxx
 *
 * Answers a JSON array of `{ id, name, type, mimeType }` (the shape the
 * website's explorer and the installed app parse). Every page of the folder
 * is followed, up to `DRIVE_LIST_MAX_ITEMS`; a longer folder is cut there
 * and the response carries `X-Drive-Truncated: true`.
 */
export async function GET(req: NextRequest) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const folderId = req.nextUrl.searchParams.get("folderID");
  if (!folderId) {
    return NextResponse.json({ error: "Missing folder ID" }, { status: 400 });
  }
  if (!isDriveId(folderId)) {
    return NextResponse.json(
      { error: "Identifiant de dossier invalide" },
      { status: 400 },
    );
  }

  try {
    const drive = getDriveClient();

    if (!(await isDriveItemAllowed(drive, authCheck.supabase, folderId))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { items: files, truncated } = await listAllDrivePages(
      async (pageToken) => {
        const response = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: "nextPageToken, files(id, name, mimeType)",
          pageSize: PAGE_SIZE,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        if (!response.data.files || !Array.isArray(response.data.files)) {
          throw new Error("Unexpected Drive list response for a folder");
        }
        return response.data;
      },
      DRIVE_LIST_MAX_ITEMS,
    );

    const items = files.map((file) => ({
      id: file.id,
      name: file.name,
      type:
        file.mimeType === "application/vnd.google-apps.folder"
          ? "folder"
          : "file",
      mimeType: file.mimeType,
    }));

    return NextResponse.json(items, {
      headers: truncated ? { "X-Drive-Truncated": "true" } : undefined,
    });
  } catch (error: unknown) {
    console.error("Error retrieving Drive files:", error);
    return NextResponse.json(
      { error: "Failed to retrieve files" },
      { status: 500 },
    );
  }
}
