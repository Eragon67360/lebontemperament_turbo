import { checkAuthorization } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const { data, error } = await authCheck.supabase
    .from("cas")
    .select("id, title, date_from, file_url")
    .order("date_from", { ascending: false });

  if (error) {
    console.error("Error fetching CA minutes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json(data);
}
