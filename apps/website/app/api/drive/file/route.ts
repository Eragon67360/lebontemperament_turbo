import { checkAuthorization } from "@/utils/auth";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

interface GoogleDriveError {
  message: string;
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: number;
      };
    };
  };
}

function getDriveClient() {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = "https://developers.google.com/oauthplayground";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientSecret || !clientId || !refreshToken) {
    throw new Error("Missing OAuth2 credentials");
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oAuth2Client });
}

/**
 * Proxies file download from Google Drive.
 * Use this instead of drive.google.com/uc?export=download which often returns
 * HTML (virus scan page) instead of the raw file.
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

  try {
    const drive = getDriveClient();

    // Get file metadata for Content-Type
    const metaRes = await drive.files.get({
      fileId,
      fields: "mimeType, name",
    });
    const mimeType = metaRes.data.mimeType || "application/octet-stream";

    // Fetch file content (arraybuffer avoids stream conversion issues)
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" },
    );

    const buffer = Buffer.from(res.data as ArrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: unknown) {
    console.error("Drive file proxy error:", error);

    const isGoogleError = (err: unknown): err is GoogleDriveError =>
      err !== null && typeof err === "object" && "message" in err;

    return NextResponse.json(
      {
        error: "Failed to retrieve file",
        details: isGoogleError(error) ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
