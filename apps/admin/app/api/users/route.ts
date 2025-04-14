// app/api/users/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  try {
    const auth = await checkAuthorization();
    const supabaseAdmin = createAdminClient();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let query = supabaseAdmin.from("profiles").select("*");

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    // Always sort by created_at desc by default
    query = query.order("created_at", { ascending: false });

    // Function to get all auth users with pagination
    const getAllAuthUsers = async () => {
      let allUsers: User[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const {
          data: { users },
          error,
        } = await supabaseAdmin.auth.admin.listUsers({
          page: page,
          perPage: 50, // default is 50
        });

        if (error) {
          console.error("Error fetching users page ${page}:", error);
          throw error;
        }

        if (!users || users.length === 0) {
          hasMore = false;
        } else {
          allUsers = [...allUsers, ...users];
          page++;
        }
      }

      return allUsers;
    };

    const [{ data: profiles, error: profilesError }, authUsersResult] =
      await Promise.all([
        query,
        getAllAuthUsers().catch((error) => {
          console.error("Error fetching auth users:", error);
          throw error;
        }),
      ]);

    if (profilesError) throw profilesError;

    // Now authUsersResult contains ALL auth users
    const authUsers = authUsersResult;

    // Merge profiles with auth users data with more precise status checking
    const enrichedUsers = profiles?.map((profile) => {
      const authUser = authUsers.find((au) => au.id === profile.id);

      let invite_status: "en attente" | "approuvé" = "en attente";

      if (authUser) {
        if (
          (authUser.invited_at && authUser.confirmed_at) ||
          authUser.email_confirmed_at
        ) {
          invite_status = "approuvé";
        }
      }

      return {
        ...profile,
        invite_status,
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!userProfile || !["admin", "superadmin"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { email, password, role, display_name } = await request.json();

    // Create user with metadata
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: display_name || email.split("@")[0],
        },
      });

    if (authError) throw authError;

    if (authData.user) {
      // Update profiles table
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          role,
          display_name: display_name || email.split("@")[0],
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;
      await supabaseAdmin.from("activities").insert({
        type: "user_created",
        user_id: data.user.id, // ID of the admin who created the user
        target_id: authData.user.id, // ID of the created user
        title: "Nouveau membre",
        description: `${
          display_name || email.split("@")[0]
        } a rejoint la plateforme`,
        metadata: {
          created_user_id: authData.user.id,
          created_user_email: email,
          created_user_role: role,
        },
      });
      return NextResponse.json({
        message: "Utilisateur créé avec succès",
        user: authData.user,
      });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await checkAuthorization();
    const supabaseAdmin = createAdminClient();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    const supabaseAdmin = createAdminClient();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "ID utilisateur et rôle requis" },
        { status: 400 }
      );
    }

    const { data: targetUser } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetUser?.role === "superadmin") {
      return NextResponse.json(
        { error: "Impossible de modifier le rôle d'un super administrateur" },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (updateError) throw updateError;

    if (!updateError) {
      // Get user details for the activity description
      const { data: updatedUser } = await supabaseAdmin
        .from("profiles")
        .select("display_name, email")
        .eq("id", userId)
        .single();

      // Log activity
      await supabaseAdmin.from("activities").insert({
        type: "user_role_changed",
        user_id: auth?.user?.id, // ID of the admin making the change
        target_id: userId, // ID of the user whose role changed
        title: "Changement de rôle",
        description: `${
          updatedUser?.display_name || updatedUser?.email
        } est maintenant ${
          role === "admin"
            ? "administrateur"
            : role === "superadmin"
            ? "super administrateur"
            : "utilisateur"
        }`,
        metadata: {
          target_user_id: userId,
          previous_role: targetUser?.role,
          new_role: role,
          changed_by: auth?.user?.id,
        },
      });

      return NextResponse.json({
        message: "Rôle utilisateur mis à jour avec succès",
      });
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    );
  }
}
