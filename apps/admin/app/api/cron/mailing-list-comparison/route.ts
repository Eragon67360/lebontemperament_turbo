// app/api/cron/mailing-list-comparison/route.ts
//
// The weekly comparison of every enabled mailing list with the member
// roster, called by the GitHub workflow mailing-list-check.yml (production). Each run records its counts in
// `mailing_list_comparisons`; check-ops-alerts pushes the superadmins when a
// list has differences, when the comparison fails, or when it stops running.
//
// When CRON_SECRET is set, the workflow sends it as a bearer token and
// nothing else gets in. Either way a list is compared at most once every 6 days by this
// route, and the answer carries counts of lists only, so a stray call can
// neither read anything nor run it in a loop. Outside production it compares
// nothing (utils/memberLists.ts).
import { runMailingListComparison } from "@/utils/mailing-list/run";
import {
  GROUPS_PRODUCTION_ONLY_MESSAGE,
  memberListsAvailable,
  productionOnlyResponse,
} from "@/utils/memberLists";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const maxDuration = 60;

/** A list compared by the cron less than this long ago is skipped. */
const MIN_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000;

function hasCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!hasCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!memberListsAvailable()) {
    return productionOnlyResponse(GROUPS_PRODUCTION_ONLY_MESSAGE);
  }

  const supabase = createAdminClient();
  const { data: lists, error } = await supabase
    .from("mailing_list_comparisons")
    .select("group_email, cron_checked_at");
  if (error) {
    console.error(
      "Mailing list cron: reading the lists failed:",
      error.message,
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const now = Date.now();
  const due = (lists ?? []).filter(
    (list) =>
      !list.cron_checked_at ||
      now - new Date(list.cron_checked_at).getTime() >= MIN_INTERVAL_MS,
  );

  let failed = 0;
  // One after the other: each reads the same roster, and Apps Script quotas
  // are per user.
  for (const list of due) {
    const outcome = await runMailingListComparison(
      supabase,
      list.group_email,
      "cron",
    );
    if (!outcome.ok) failed++;
  }

  return NextResponse.json({
    compared: due.length,
    skipped: (lists?.length ?? 0) - due.length,
    failed,
  });
}
