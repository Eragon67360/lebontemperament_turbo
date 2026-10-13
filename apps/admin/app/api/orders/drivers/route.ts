import { dbErrorResponse, requireSuperadmin } from "@/utils/orders/server";
import type { Driver } from "@/utils/orders/types";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET: who can drive a delivery round (the superadmins), for « Ajouter à la
 * tournée ». The caller is listed too: they are the default driver.
 */
export async function GET() {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("role", "superadmin")
    .order("display_name", { ascending: true });
  if (error) {
    return dbErrorResponse(error, "Les livreurs n'ont pas pu être chargés");
  }
  const drivers: Driver[] = data.map((profile) => ({
    id: profile.id,
    name:
      profile.display_name?.trim() || profile.email?.split("@")[0] || "Membre",
  }));
  return NextResponse.json({ drivers, me: auth.user.id });
}
