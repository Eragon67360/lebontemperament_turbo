import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

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

export async function GET(req: NextRequest) {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = "https://developers.google.com/oauthplayground";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientSecret || !clientId || !refreshToken) {
    return NextResponse.json(
      { error: "Missing OAuth2 credentials" },
      { status: 500 }
    );
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });
    const folderId = req.nextUrl.searchParams.get("folderID");

    if (!folderId) {
      return NextResponse.json({ error: "Missing folder ID" }, { status: 400 });
    }

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType)",
    });

    if (!response.data.files || !Array.isArray(response.data.files)) {
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 500 }
      );
    }

    const items =
      response.data.files?.map((file) => ({
        id: file.id,
        name: file.name,
        type:
          file.mimeType === "application/vnd.google-apps.folder"
            ? "folder"
            : "file",
        mimeType: file.mimeType,
      })) || [];

    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error("Error retrieving files:", error);

    // Type guard to check if error is an object
    const isGoogleError = (err: unknown): err is GoogleDriveError => {
      return err !== null && typeof err === "object" && "message" in err;
    };

    if (isGoogleError(error) && error.response?.data) {
      console.error("Error details:", error.response.data);
    }

    return NextResponse.json(
      {
        error: "Failed to retrieve files",
        details: isGoogleError(error) ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  // const auth_uri = "https://accounts.google.com/o/oauth2/auth";
  const redirectUri = "https://developers.google.com/oauthplayground";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientSecret || !clientId || !refreshToken) {
    return NextResponse.json(
      { error: "Missing OAuth2 credentials" },
      { status: 500 }
    );
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });
    const body = await req.json();
    // const folderId = req.nextUrl.searchParams.get('folderID');
    const { folderId, files } = body;
    if (!folderId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing folder ID or files" },
        { status: 400 }
      );
    }

    const responses = [];

    for (const file of files) {
      const fileMetadata = {
        name: file.name,
        parents: [folderId],
        mimeType:
          file.type === "folder"
            ? "application/vnd.google-apps.folder"
            : file.mimeType,
      };

      const media =
        file.type !== "folder"
          ? {
              mimeType: file.mimeType,
              body: Readable.from(file.content),
            }
          : undefined;

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, mimeType, parents",
      });

      responses.push({
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        parents: response.data.parents,
      });
    }

    return NextResponse.json(responses);
  } catch (error: unknown) {
    console.error("Error uploading files:", error);

    // Type guard to check if error is an object
    const isGoogleError = (err: unknown): err is GoogleDriveError => {
      return err !== null && typeof err === "object" && "message" in err;
    };

    if (isGoogleError(error) && error.response?.data) {
      console.error("Error details:", error.response.data);
    }

    return NextResponse.json(
      {
        error: "Failed to upload files",
        details: isGoogleError(error) ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  // const auth_uri = "https://accounts.google.com/o/oauth2/auth";
  const redirectUri = "https://developers.google.com/oauthplayground";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientSecret || !clientId || !refreshToken) {
    return NextResponse.json(
      { error: "Missing OAuth2 credentials" },
      { status: 500 }
    );
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const fileId = req.nextUrl.searchParams.get("fileID");
    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
    }

    await drive.files.delete({
      fileId,
    });

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting files:", error);

    // Type guard to check if error is an object
    const isGoogleError = (err: unknown): err is GoogleDriveError => {
      return err !== null && typeof err === "object" && "message" in err;
    };

    if (isGoogleError(error) && error.response?.data) {
      console.error("Error details:", error.response.data);
    }

    return NextResponse.json(
      {
        error: "Failed to delete files",
        details: isGoogleError(error) ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
