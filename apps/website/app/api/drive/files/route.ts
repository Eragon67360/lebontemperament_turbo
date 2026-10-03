import { getDriveClient, isDriveItemAllowed } from "@/lib/drive";
import { checkAuthorization } from "@/utils/auth";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { NextRequest, NextResponse } from "next/server";

/**
 * Lists a Drive folder for the members area and the mobile app.
 * Only folders configured in `drive_folders`, or below them, can be listed.
 *
 * GET /api/drive/files?folderID=xxx
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

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType)",
    });

    if (!response.data.files || !Array.isArray(response.data.files)) {
      console.error("Unexpected Drive list response for a folder");
      return NextResponse.json(
        { error: "Failed to retrieve files" },
        { status: 500 },
      );
    }

    const items = response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      type:
        file.mimeType === "application/vnd.google-apps.folder"
          ? "folder"
          : "file",
      mimeType: file.mimeType,
    }));

    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error("Error retrieving Drive files:", error);
    return NextResponse.json(
      { error: "Failed to retrieve files" },
      { status: 500 },
    );
  }
}
