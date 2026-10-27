// app/api/mailing-list-comparison/route.ts
//
// Comparison between the member roster and one Google Group (« Liste de
// diffusion » page). GET runs it for an enabled group and answers the
// differences; POST turns the comparison of a group on or off (the weekly
// check and its alert follow the enabled groups). GET reads the roster and
// the group: production only (utils/memberLists.ts).
import { checkAuthorization } from "@/utils/auth";
import { runMailingListComparison } from "@/utils/mailing-list/run";
import {
  isMissingTable,
  NOT_INSTALLED_MESSAGE,
  toggleComparisonSchema,
} from "@/utils/mailing-list/schemas";
import {
  GROUPS_PRODUCTION_ONLY_MESSAGE,
  memberListsAvailable,
  productionOnlyResponse,
} from "@/utils/memberLists";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// Reading the roster and the group can take several seconds each.
export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!memberListsAvailable()) {
    return productionOnlyResponse(GROUPS_PRODUCTION_ONLY_MESSAGE);
  }

  const groupEmail = new URL(request.url).searchParams
    .get("groupEmail")
    ?.trim()
    .toLowerCase();
  if (!groupEmail) {
    return NextResponse.json({ error: "Groupe manquant" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("mailing_list_comparisons")
    .select("group_email, cron_checked_at")
    .eq("group_email", groupEmail)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: NOT_INSTALLED_MESSAGE, notInstalled: true },
        { status: 503 },
      );
    }
    console.error("GET /api/mailing-list-comparison:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!row) return NextResponse.json({ enabled: false });

  const outcome = await runMailingListComparison(
    supabase,
    groupEmail,
    "manual",
  );
  return NextResponse.json({
    enabled: true,
    cronCheckedAt: row.cron_checked_at,
    ...outcome,
  });
}

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = toggleComparisonSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { groupEmail, enabled } = parsed.data;

  const supabase = createAdminClient();
  const { error } = enabled
    ? await supabase
        .from("mailing_list_comparisons")
        .upsert(
          { group_email: groupEmail, created_by: auth.user.id },
          { onConflict: "group_email", ignoreDuplicates: true },
        )
    : await supabase
        .from("mailing_list_comparisons")
        .delete()
        .eq("group_email", groupEmail);
  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: NOT_INSTALLED_MESSAGE, notInstalled: true },
        { status: 503 },
      );
    }
    console.error("POST /api/mailing-list-comparison:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return NextResponse.json({ enabled });
}
