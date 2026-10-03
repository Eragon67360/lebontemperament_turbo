// Google Drive access for the index sync: a read-only token from the service
// account (same JWT-bearer flow as sync-rehearsals-from-calendar) and a
// DriveReader over `files.get` and `files.list`.
import { importPKCS8, SignJWT } from "npm:jose@5.2.0";

import { DriveAccessError, type DriveItem, type DriveReader } from "./plan.ts";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const FILES_BASE = "https://www.googleapis.com/drive/v3/files";
const ITEM_FIELDS = "id,name,mimeType,size,modifiedTime,md5Checksum,parents";
const PAGE_SIZE = 200;
/** Pages per folder; the planner's node cap stops a run long before this. */
const MAX_PAGES = 50;

function logGoogle(event: string, data: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      source: "google",
      event,
      ...data,
    }),
  );
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface DriveErrorBody {
  error?: { message?: string };
}

interface ListResponse extends DriveErrorBody {
  files?: DriveItem[];
  nextPageToken?: string;
}

function parseServiceAccount(rawJson: string): ServiceAccount {
  const parsed = JSON.parse(rawJson) as Partial<ServiceAccount>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.",
    );
  }
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
    token_uri: parsed.token_uri ?? DEFAULT_TOKEN_URI,
  };
}

/** The service account's email, for the "share this folder with" hint. */
export function serviceAccountEmail(serviceAccountJson: string): string {
  return parseServiceAccount(serviceAccountJson).client_email;
}

export async function getDriveAccessToken(
  serviceAccountJson: string,
): Promise<string> {
  const serviceAccount = parseServiceAccount(serviceAccountJson);
  logGoogle("token_request", { client_email: serviceAccount.client_email });
  const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");
  const tokenUri = serviceAccount.token_uri ?? DEFAULT_TOKEN_URI;

  const assertion = await new SignJWT({ scope: DRIVE_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.client_email)
    .setAudience(tokenUri)
    .setIssuedAt()
    .setExpirationTime("55m")
    .sign(privateKey);

  const tokenResponse = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const body = (await tokenResponse.json()) as TokenResponse;
  if (!tokenResponse.ok || !body.access_token) {
    const message =
      body.error_description ?? body.error ?? tokenResponse.statusText;
    logGoogle("token_failed", { status: tokenResponse.status, message });
    throw new Error(`Google token request failed: ${message}`);
  }

  logGoogle("token_acquired", { expires_in: body.expires_in });
  return body.access_token;
}

async function driveGet<T extends DriveErrorBody>(
  url: string,
  accessToken: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    throw new DriveAccessError(
      0,
      error instanceof Error ? error.message : String(error),
    );
  }

  const body = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    throw new DriveAccessError(
      response.status,
      body.error?.message ?? response.statusText,
    );
  }
  return body;
}

/** A DriveReader over the Drive v3 API, shared drives included. */
export function createDriveReader(accessToken: string): DriveReader {
  return {
    async getFolder(id) {
      const params = new URLSearchParams({
        fields: "id,name,mimeType",
        supportsAllDrives: "true",
      });
      return await driveGet<DriveItem & DriveErrorBody>(
        `${FILES_BASE}/${encodeURIComponent(id)}?${params.toString()}`,
        accessToken,
      );
    },

    async listChildren(folderId) {
      const items: DriveItem[] = [];
      let pageToken: string | undefined;
      let page = 0;

      do {
        const params = new URLSearchParams({
          q: `'${folderId}' in parents and trashed = false`,
          fields: `nextPageToken,files(${ITEM_FIELDS})`,
          pageSize: String(PAGE_SIZE),
          orderBy: "folder,name",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
        });
        if (pageToken) params.set("pageToken", pageToken);

        const body = await driveGet<ListResponse>(
          `${FILES_BASE}?${params.toString()}`,
          accessToken,
        );
        page++;
        items.push(...(body.files ?? []));
        pageToken = body.nextPageToken;
      } while (pageToken && page < MAX_PAGES);

      if (pageToken) {
        throw new DriveAccessError(
          0,
          `Folder ${folderId} has more than ${PAGE_SIZE * MAX_PAGES} items.`,
        );
      }

      return items;
    },
  };
}
