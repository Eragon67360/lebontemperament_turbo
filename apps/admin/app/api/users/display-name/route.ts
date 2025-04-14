// app/api/users/display-name/route.ts
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

async function checkAuthorization() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "Non authentifié", status: 401 };
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!userProfile || !["admin", "superadmin"].includes(userProfile.role)) {
    return { authorized: false, error: "Non autorisé", status: 403 };
  }

  return { authorized: true, data };
}

export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    const supabaseAdmin = createAdminClient();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, display_name } = await request.json();

    if (!userId || display_name === undefined) {
      return NextResponse.json(
        { error: "ID utilisateur et nom d'affichage requis" },
        { status: 400 }
      );
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { display_name } }
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
      { status: 500 }
    );
  }
}
