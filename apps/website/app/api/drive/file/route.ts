import {
  getDriveClient,
  isDriveItemAllowed,
  isDriveNotFound,
} from "@/lib/drive";
import { errorCodes } from "@/lib/errorCodes";
import { checkAuthorization } from "@/utils/auth";
import {
  DRIVE_FILE_SANDBOX_CSP,
  driveDownloadName,
  driveDownloadPlan,
  driveFileHeaders,
} from "@repo/domain/utils/driveDownload";
import { isDriveId } from "@repo/domain/utils/driveScope";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

const FORBIDDEN = { error: "Accès refusé" };

/** `?download=1` (or `true`) asks for an attachment instead of inline bytes. */
const wantsDownload = (value: string | null) =>
  value === "1" || value === "true";

/** What a member reads when a score opened in a tab (« Voir ») fails. */
const VIEWER_ERRORS: Record<number, string> = {
  401: "Ta session a expiré. Reconnecte-toi, puis rouvre la partition.",
  403: "Ce document n'est pas accessible depuis l'espace membres.",
  415: "Ce type de document ne peut pas être affiché.",
};

/**
 * An error answer: JSON for the app and the site's scripts, a short French
 * page when the browser opened the URL as a page (« Voir » in Mes partitions),
 * so a member never faces raw JSON in a tab. Both run nothing: the page
 * keeps only its inline styles.
 */
function failure(req: NextRequest, status: number, body: { error: unknown }) {
  if (req.headers.get("sec-fetch-dest") !== "document") {
    return NextResponse.json(body, {
      status,
      headers: { "Content-Security-Policy": DRIVE_FILE_SANDBOX_CSP },
    });
  }
  const message =
    VIEWER_ERRORS[status] ??
    "Le document n'a pas pu être ouvert. Réessaie dans un instant.";
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>Document indisponible</title>
</head>
<body style="font-family: system-ui, sans-serif; font-size: 18px; line-height: 1.5; max-width: 32rem; margin: 15vh auto; padding: 0 1.5rem">
<h1 style="font-size: 1.6rem; font-weight: 600">Document indisponible</h1>
<p>${message}</p>
<p><a href="/membres/travail">Retour à mes partitions</a></p>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": DRIVE_FILE_SANDBOX_CSP,
    },
  });
}

/**
 * Proxies a Drive file for the members area and the mobile app. Drive's own
 * public download link only works for files shared with "anyone with the
 * link" and often answers an HTML page (virus scan) instead of the bytes.
 * Only files inside the folders configured in `drive_folders` are served; a
 * file under the whole-Drive root (`racine`) but in no tab folder goes to
 * admins and superadmins only.
 *
 * GET /api/drive/file?fileId=xxx             the bytes: inline for PDFs,
 *                                            PNG, JPEG, GIF and WebP images,
 *                                            audio and video (viewers, and
 *                                            the members' « Voir » tab), as
 *                                            an octet-stream attachment for
 *                                            any other type
 * GET /api/drive/file?fileId=xxx&download=1  as an attachment named like
 *                                            the Drive file (RFC 8187)
 *
 * Google Docs, Sheets, Slides and Drawings are exported as PDF (the name
 * gains `.pdf`); folders, Forms and other Google-native items answer 415.
 * Every answer but a PDF carries a sandbox policy (`driveFileHeaders`); the
 * site-wide policy in next.config.js leaves this route out, since a policy
 * set there would replace the route's own.
 */
export async function GET(req: NextRequest) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return failure(req, authCheck.status, { error: authCheck.error });
  }

  const fileId = req.nextUrl.searchParams.get("fileId");
  const download = wantsDownload(req.nextUrl.searchParams.get("download"));

  if (!fileId) {
    return failure(req, 400, { error: "Missing fileId" });
  }
  if (!isDriveId(fileId)) {
    return failure(req, 400, { error: "Identifiant de fichier invalide" });
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
        return failure(req, 403, FORBIDDEN);
      }
      throw error;
    }

    const allowed = await isDriveItemAllowed(drive, authCheck, fileId, [
      [fileId, metadata.data.parents ?? []],
    ]);
    if (!allowed) {
      return failure(req, 403, FORBIDDEN);
    }

    const plan = driveDownloadPlan(metadata.data.mimeType);
    if (plan.kind === "unsupported") {
      return failure(req, 415, {
        error: "Ce type d'élément ne peut pas être téléchargé",
      });
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
      // Type, disposition and policy. Inline answers carry the name too, so
      // a score opened in a tab and saved from the browser's viewer keeps it
      // (not « file.pdf »).
      ...driveFileHeaders(
        plan.mimeType,
        driveDownloadName(metadata.data.name, plan),
        download,
      ),
      // Members-only content: browsers may cache it, shared caches may not.
      "Cache-Control": "private, max-age=3600",
    };
    // Drive knows the size of stored files (not of exports), so the app and
    // the browser can show progress.
    if (plan.kind !== "export" && metadata.data.size) {
      headers["Content-Length"] = metadata.data.size;
    }

    return new NextResponse(body, { headers });
  } catch (error: unknown) {
    console.error("Drive file proxy error:", errorCodes(error));
    return failure(req, 500, { error: "Failed to retrieve file" });
  }
}
