// app/api/drive-sync/route.ts
//
// The admin's door to the sync-drive-index edge function. Any admin may run
// it (owner decision, #433): the route checks the session, then forwards the
// caller's access token to the function, which verifies it again through
// Supabase Auth. The admin app never holds the functions' internal secret.
import { DRIVE_SYNC_RUN_COLUMNS } from "@/lib/columns";
import { checkAuthorization } from "@/utils/auth";
import { parseSyncMode } from "@/utils/driveSync";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// A full walk of the Drive can take a while; Vercel's default is 10 s.
export const maxDuration = 60;

const FUNCTION_TIMEOUT_MS = 55_000;
const RUNS_SHOWN = 10;

const INTERNAL_ERROR =
  "La synchronisation a échoué. Le détail est dans les journaux de la fonction.";

const ERROR_BY_CODE: Record<string, string> = {
  limit: "", // the function's own message is already plain French
  cron_removals: "",
  google_auth:
    "Le compte de service n'a pas pu s'authentifier auprès de Google. Vérifiez sa clé et l'activation de l'API Drive.",
  drive: "Google Drive n'a pas répondu correctement. Réessayez plus tard.",
  database:
    "La base de données a refusé l'opération. Le détail est dans les journaux de la fonction.",
  config: "La fonction de synchronisation n'est pas configurée.",
  internal: INTERNAL_ERROR,
};

/** Plain French for whatever the function answered; never its technical detail. */
function plainFunctionError(
  status: number,
  payload: Record<string, unknown>,
): string {
  if (status === 401) {
    return "Session refusée par la fonction de synchronisation : reconnectez-vous.";
  }
  if (status === 403) {
    return "Seuls les administrateurs peuvent lancer la synchronisation.";
  }
  const code = typeof payload.error_code === "string" ? payload.error_code : "";
  const message = typeof payload.error === "string" ? payload.error : "";
  const known = ERROR_BY_CODE[code];
  if (known !== undefined) return known || message || INTERNAL_ERROR;
  if (status === 400) return "Requête invalide.";
  return INTERNAL_ERROR;
}

// GET - The last runs (RLS lets admins read drive_sync_runs)
export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("drive_sync_runs")
      .select(DRIVE_SYNC_RUN_COLUMNS)
      .order("started_at", { ascending: false })
      .limit(RUNS_SHOWN);

    if (error) {
      console.error("Error fetching drive sync runs:", error);
      return NextResponse.json(
        { error: "Failed to fetch drive sync runs" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/drive-sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Run a dry run or an apply through the edge function
export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json().catch(() => ({}))) as {
      mode?: unknown;
    };
    const mode = parseSyncMode(body.mode);
    if (!mode) {
      return NextResponse.json(
        { error: 'mode doit valoir "dry_run" ou "apply"' },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      console.error("POST /api/drive-sync: Supabase env missing");
      return NextResponse.json(
        { error: "La synchronisation Drive n'est pas configurée." },
        { status: 500 },
      );
    }

    // Only to forward the token: the function re-verifies it with Auth.
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Session expirée, reconnectez-vous." },
        { status: 401 },
      );
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/functions/v1/sync-drive-index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ mode }),
        signal: AbortSignal.timeout(FUNCTION_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      console.error("POST /api/drive-sync: function call failed:", error);
      return NextResponse.json(
        {
          error: timedOut
            ? "La synchronisation prend plus de temps que prévu. Elle continue en arrière-plan : son résultat apparaîtra dans les dernières synchronisations."
            : "Impossible de joindre la fonction de synchronisation.",
        },
        { status: 504 },
      );
    }

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!payload) {
      return NextResponse.json(
        { error: "Réponse illisible de la fonction de synchronisation." },
        { status: 502 },
      );
    }

    if (!response.ok) {
      // Technical detail stays in the logs; the admin gets plain French.
      console.error(
        "POST /api/drive-sync: function answered",
        response.status,
        payload,
      );
      return NextResponse.json(
        {
          ...payload,
          ok: false,
          error: plainFunctionError(response.status, payload),
        },
        { status: response.status === 400 ? 400 : 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error in POST /api/drive-sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
