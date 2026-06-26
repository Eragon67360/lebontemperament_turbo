import { importPKCS8, SignJWT } from "npm:jose@5.2.0";

import type { GoogleCalendarEvent } from "./types.ts";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const EVENTS_BASE = "https://www.googleapis.com/calendar/v3/calendars";

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
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface EventsResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  error?: {
    message?: string;
  };
}

interface FetchEventsOptions {
  calendarId: string;
  serviceAccountJson: string;
  timeMin: string;
  timeMax?: string;
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

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = parseServiceAccount(serviceAccountJson);
  logGoogle("token_request", { client_email: serviceAccount.client_email });
  const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");
  const tokenUri = serviceAccount.token_uri ?? DEFAULT_TOKEN_URI;

  const assertion = await new SignJWT({ scope: CALENDAR_SCOPE })
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
    logGoogle("token_failed", {
      status: tokenResponse.status,
      message: body.error_description ?? body.error ?? tokenResponse.statusText,
    });
    throw new Error(
      `Google token request failed: ${body.error_description ?? body.error ?? tokenResponse.statusText}`,
    );
  }

  logGoogle("token_acquired", { expires_in: body.expires_in });
  return body.access_token;
}

export async function fetchCalendarEvents({
  calendarId,
  serviceAccountJson,
  timeMin,
  timeMax,
}: FetchEventsOptions): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getAccessToken(serviceAccountJson);
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  let page = 0;

  logGoogle("events_fetch_start", { calendarId, timeMin, timeMax });

  do {
    const params = new URLSearchParams({
      timeMin,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      showDeleted: "false",
    });

    if (timeMax) params.set("timeMax", timeMax);
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `${EVENTS_BASE}/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const body = (await response.json()) as EventsResponse;

    if (!response.ok) {
      logGoogle("events_fetch_failed", {
        page,
        status: response.status,
        message: body.error?.message ?? response.statusText,
      });
      throw new Error(
        `Google Calendar events request failed: ${body.error?.message ?? response.statusText}`,
      );
    }

    page++;
    const pageItems = body.items ?? [];
    logGoogle("events_page", { page, items: pageItems.length });
    events.push(...pageItems);
    pageToken = body.nextPageToken;
  } while (pageToken);

  const withId = events.filter((event) => Boolean(event.id));
  logGoogle("events_fetch_complete", {
    pages: page,
    total: events.length,
    with_id: withId.length,
  });

  return withId;
}
