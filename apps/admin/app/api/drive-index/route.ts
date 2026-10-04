// app/api/drive-index/route.ts
//
// Read-only: the live Drive index (programmes, groups and documents as the
// nightly or admin sync last saw them) for « Partitions et documents ».
// Admins only, checked first. It reads with the caller's own session, never
// the service role: RLS already lets signed-in users read the live index
// (removed_at is null), admins read the sync runs, and drive_folders is
// readable. Only the columns the screen shows leave the database (no paths,
// checksums or internal UUIDs).
import { checkAuthorization } from "@/utils/auth";
import { DRIVE_INDEX_COLUMNS, type DriveIndexNode } from "@/utils/drive/tree";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// PostgREST returns at most 1000 rows per request; the sync caps a run at
// 5000 nodes, so six pages always cover the index.
const PAGE_SIZE = 1000;
const MAX_PAGES = 6;
const APPLIES_SHOWN = 5;
// Only what syncStatus() reads: when a run started and finished, what it was
// and how it ended. No trigger, no error text (the run history has its own
// route for those).
const SYNC_RUN_COLUMNS = "started_at, finished_at, mode, status";

export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();

    const nodes: DriveIndexNode[] = [];
    let truncated = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const { data, error } = await supabase
        .from("drive_index_nodes")
        .select(DRIVE_INDEX_COLUMNS)
        .is("removed_at", null)
        .order("drive_id")
        .range(from, from + PAGE_SIZE - 1);
      if (error) {
        console.error("Error fetching the Drive index:", error);
        return NextResponse.json(
          { error: "Failed to fetch the Drive index" },
          { status: 500 },
        );
      }
      nodes.push(...data);
      if (data.length < PAGE_SIZE) break;
      truncated = page === MAX_PAGES - 1;
    }

    // The last applies decide the tone; the last successful apply, queried on
    // its own, keeps « Dernière mise à jour réussie » visible however many
    // applies failed since.
    const [roots, applies, lastSuccess] = await Promise.all([
      supabase
        .from("drive_folders")
        .select("slug, label, display_order")
        .order("display_order"),
      supabase
        .from("drive_sync_runs")
        .select(SYNC_RUN_COLUMNS)
        .eq("mode", "apply")
        .order("started_at", { ascending: false })
        .limit(APPLIES_SHOWN),
      supabase
        .from("drive_sync_runs")
        .select(SYNC_RUN_COLUMNS)
        .eq("mode", "apply")
        .eq("status", "success")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (roots.error || applies.error || lastSuccess.error) {
      console.error(
        "Error fetching Drive roots or sync runs:",
        roots.error ?? applies.error ?? lastSuccess.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch the Drive index" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      nodes,
      truncated,
      roots: roots.data,
      applies: applies.data,
      lastSuccess: lastSuccess.data,
    });
  } catch (error) {
    console.error("Error in GET /api/drive-index:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
