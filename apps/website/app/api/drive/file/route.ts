import {
  getDriveClient,
  isDriveItemAllowed,
  isDriveNotFound,
} from "@/lib/drive";
import { checkAuthorization } from "@/utils/auth";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { NextRequest, NextResponse } from "next/server";

const FORBIDDEN = { error: "Accès refusé" };

/**
 * Proxies file download from Google Drive.
 * Use this instead of drive.google.com/uc?export=download which often returns
 * HTML (virus scan page) instead of the raw file.
 * Only files inside the folders configured in `drive_folders` are served.
 *
 * GET /api/drive/file?fileId=xxx
 */
export async function GET(req: NextRequest) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const fileId = req.nextUrl.searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }
  if (!isDriveId(fileId)) {
    return NextResponse.json(
      { error: "Identifiant de fichier invalide" },
      { status: 400 },
    );
  }

  try {
    const drive = getDriveClient();

    // Get file metadata for Content-Type (and its parents for the scope check)
    let metadata;
    try {
      metadata = await drive.files.get({
        fileId,
        fields: "mimeType, name, parents",
        supportsAllDrives: true,
      });
    } catch (error) {
      // Unknown and out-of-scope files get the same answer.
      if (isDriveNotFound(error)) {
        return NextResponse.json(FORBIDDEN, { status: 403 });
      }
      throw error;
    }

    const allowed = await isDriveItemAllowed(
      drive,
      authCheck.supabase,
      fileId,
      [[fileId, metadata.data.parents ?? []]],
    );
    if (!allowed) {
      return NextResponse.json(FORBIDDEN, { status: 403 });
    }

    const mimeType = metadata.data.mimeType || "application/octet-stream";

    // Fetch file content (arraybuffer avoids stream conversion issues)
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );

    const buffer = Buffer.from(res.data as ArrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        // Members-only content: browsers may cache it, shared caches may not.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    console.error("Drive file proxy error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 },
    );
  }
}
