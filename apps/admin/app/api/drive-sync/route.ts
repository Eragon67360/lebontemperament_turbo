// app/api/drive-sync/route.ts
//
// The admin's door to the sync-drive-index edge function. Any admin may run
// it (owner decision, #433): the route checks the session, then calls the
// function server-side with the internal secret, which never reaches the
// browser.
import { checkAuthorization } from "@/utils/auth";
import { parseSyncMode } from "@/utils/driveSync";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// A full walk of the Drive can take a while; Vercel's default is 10 s.
export const maxDuration = 60;

const FUNCTION_TIMEOUT_MS = 55_000;
const RUNS_SHOWN = 10;

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
      .select("*")
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
    const secret = process.env.INTERNAL_FUNCTION_SECRET;
    if (!supabaseUrl || !anonKey || !secret) {
      console.error(
        "POST /api/drive-sync: INTERNAL_FUNCTION_SECRET or Supabase env missing",
      );
      return NextResponse.json(
        {
          error:
            "La synchronisation Drive n'est pas configurée sur ce déploiement (INTERNAL_FUNCTION_SECRET).",
        },
        { status: 500 },
      );
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/functions/v1/sync-drive-index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          "x-internal-secret": secret,
        },
        body: JSON.stringify({ mode, triggeredBy: auth.user.id }),
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
      // 401 means the admin's secret and the function's differ: say so
      // without echoing anything.
      const error =
        response.status === 401
          ? "Le secret interne de l'admin ne correspond pas à celui de la fonction."
          : typeof payload.error === "string"
            ? payload.error
            : "La synchronisation a échoué.";
      return NextResponse.json(
        { ...payload, ok: false, error },
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
