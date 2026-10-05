import {
  getDriveClient,
  isDriveItemAllowed,
  isDriveNotFound,
} from "@/lib/drive";
import { checkAuthorization } from "@/utils/auth";
import {
  contentDisposition,
  driveDownloadName,
  driveDownloadPlan,
} from "@repo/domain/utils/driveDownload";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

const FORBIDDEN = { error: "Accès refusé" };

/** `?download=1` (or `true`) asks for an attachment instead of inline bytes. */
const wantsDownload = (value: string | null) =>
  value === "1" || value === "true";

/**
 * Proxies a Drive file for the members area and the mobile app. Drive's own
 * public download link only works for files shared with "anyone with the
 * link" and often answers an HTML page (virus scan) instead of the bytes.
 * Only files inside the folders configured in `drive_folders` are served.
 *
 * GET /api/drive/file?fileId=xxx             the bytes, inline (viewers)
 * GET /api/drive/file?fileId=xxx&download=1  as an attachment named like
 *                                            the Drive file (RFC 8187)
 *
 * Google Docs, Sheets, Slides and Drawings are exported as PDF (the name
 * gains `.pdf`); folders, Forms and other Google-native items answer 415.
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
  const download = wantsDownload(req.nextUrl.searchParams.get("download"));

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
        fields: "mimeType, name, parents, size",
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

    const plan = driveDownloadPlan(metadata.data.mimeType);
    if (plan.kind === "unsupported") {
      return NextResponse.json(
        { error: "Ce type d'élément ne peut pas être téléchargé" },
        { status: 415 },
      );
    }

    // Streamed, not buffered: a buffered function response is capped at
    // 4.5 MB on Vercel, and scanned scores or recordings are often larger.
    const res =
      plan.kind === "export"
        ? await drive.files.export(
            { fileId, mimeType: plan.mimeType },
            { responseType: "stream" },
          )
        : await drive.files.get(
            { fileId, alt: "media", supportsAllDrives: true },
            { responseType: "stream" },
          );

    // gaxios hands back a Node stream or, with its fetch adapter, a web one.
    const data = res.data as unknown;
    const body =
      data instanceof Readable
        ? (Readable.toWeb(data) as ReadableStream<Uint8Array>)
        : (data as ReadableStream<Uint8Array>);

    const headers: Record<string, string> = {
      "Content-Type": plan.mimeType,
      // Members-only content: browsers may cache it, shared caches may not.
      "Cache-Control": "private, max-age=3600",
    };
    // Drive knows the size of stored files (not of exports), so the app and
    // the browser can show progress.
    if (plan.kind !== "export" && metadata.data.size) {
      headers["Content-Length"] = metadata.data.size;
    }
    if (download) {
      headers["Content-Disposition"] = contentDisposition(
        driveDownloadName(metadata.data.name, plan),
      );
    }

    return new NextResponse(body, { headers });
  } catch (error: unknown) {
    console.error("Drive file proxy error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 },
    );
  }
}
