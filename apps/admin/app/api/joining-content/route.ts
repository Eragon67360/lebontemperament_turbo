import { checkAuthorization } from "@/utils/auth";
import { FAQ_COLUMNS, SLOT_COLUMNS } from "@/utils/joining/schemas";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * « Rejoindre et FAQ »: GET returns the rehearsal slots of /rejoindre and the
 * questions of /faq, archived ones included, in the website's order, and
 * whether the caller may delete for good (superadmins).
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const [slots, faq] = await Promise.all([
    supabase
      .from("joining_slots")
      .select(SLOT_COLUMNS)
      .order("sort_order", { ascending: true }),
    supabase
      .from("faq_items")
      .select(FAQ_COLUMNS)
      .order("sort_order", { ascending: true }),
  ]);

  const error = slots.error ?? faq.error;
  if (error) {
    // 42P01 / PGRST205: the migration isn't applied on this database yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missing
          ? "La FAQ et les horaires ne sont pas encore installés sur cette base."
          : "Erreur serveur",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  return NextResponse.json({
    slots: slots.data,
    faq: faq.data,
    canDelete: auth.role === "superadmin",
  });
}
