// app/api/users/display-name/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const supabaseAdmin = createAdminClient();

    const { userId, display_name } = await request.json();

    if (!userId || display_name === undefined) {
      return NextResponse.json(
        { error: "ID utilisateur et nom d'affichage requis" },
        { status: 400 },
      );
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { display_name } },
    );

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ display_name })
      .eq("id", userId);

    if (profileError) throw profileError;

    return NextResponse.json({
      message: "Nom d'affichage mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating display name:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du nom d'affichage" },
      { status: 500 },
    );
  }
}
