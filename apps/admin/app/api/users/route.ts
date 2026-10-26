// app/api/users/route.ts
import {
  decideRoleChange,
  decideUserCreation,
  decideUserDeletion,
  type UserRole,
} from "@/utils/access";
import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { deleteMemberAccount } from "@/utils/members/memberFiles";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  userCreateSchema,
  userRolePatchSchema,
} from "@/utils/users/apiSchemas";
import { inviteStatusOf, listAuthSummaries } from "@/utils/users/authUsers";
import { normalizeName } from "@repo/domain/roster/normalize";
import { NextResponse } from "next/server";

const roleLabel = (role: UserRole) =>
  role === "admin"
    ? "administrateur"
    : role === "superadmin"
      ? "super administrateur"
      : "utilisateur";
export async function GET(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const supabaseAdmin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let query = supabaseAdmin
      .from("profiles")
      .select(
        "id, email, display_name, role, created_at, address, home_phone, mobile_phone, voice, profile_picture_url",
      );

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,display_name.ilike.%${search}%`,
      );
    }

    // Always sort by created_at desc by default
    query = query.order("created_at", { ascending: false });

    const [{ data: profiles, error: profilesError }, authUsersResult] =
      await Promise.all([
        query,
        listAuthSummaries(supabaseAdmin).catch((error) => {
          console.error("Error fetching auth users:", error);
          throw error;
        }),
      ]);

    if (profilesError) throw profilesError;

    const authById = new Map(authUsersResult.map((au) => [au.id, au]));

    // Merge profiles with auth users data with more precise status checking
    const enrichedUsers = profiles?.map((profile) => {
      const authUser = authById.get(profile.id);

      const invite_status = inviteStatusOf(authUser);

      // Get avatar: prioritize profile_picture_url over Google avatar
      const googleAvatar = authUser?.avatar_url;
      const avatar = profile.profile_picture_url || googleAvatar || undefined;

      return {
        ...profile,
        invite_status,
        avatar,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        invited_at: authUser?.invited_at ?? null,
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Only what « Ajouter un membre » sends: unknown keys are refused.
    const parsed = parsePatchBody(userCreateSchema, await readJson(request));
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }
    const { email, password, role, display_name } = parsed.data;

    // Admins create `user` accounts; only a superadmin creates admins.
    const decision = decideUserCreation(auth.role, role);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.error },
        { status: decision.status },
      );
    }
    const newRole = role as UserRole;
    // One order everywhere: « Prénom NOM », whatever was typed.
    const name =
      (typeof display_name === "string" && normalizeName(display_name)) ||
      email.split("@")[0];

    const supabaseAdmin = createAdminClient();

    // Create user with metadata
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: name,
        },
      });

    if (authError) throw authError;

    if (authData.user) {
      // Update profiles table
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: newRole,
          display_name: name,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;
      const { error: activityError } = await supabaseAdmin
        .from("activities")
        .insert({
          type: "user_created",
          user_id: auth.user.id, // ID of the admin who created the user
          target_id: authData.user.id, // ID of the created user
          title: "Nouveau membre",
          description: `${name} a rejoint la plateforme`,
          metadata: {
            created_user_id: authData.user.id,
            created_user_email: email,
            created_user_role: newRole,
          },
        });
      if (activityError) {
        console.error("Error logging user creation:", activityError);
      }
      return NextResponse.json({
        message: "Utilisateur créé avec succès",
        user: authData.user,
      });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const supabaseAdmin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 },
      );
    }

    // A user without a profile row has no role beyond the default `user`.
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw targetError;

    const decision = decideUserDeletion(
      { id: auth.user.id, role: auth.role },
      { id: userId, role: targetProfile?.role ?? "user" },
    );
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.error },
        { status: decision.status },
      );
    }

    // Storage files first, then the account (#354).
    await deleteMemberAccount(supabaseAdmin, userId);

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const parsed = parsePatchBody(userRolePatchSchema, await readJson(request));
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }
    const { userId, role } = parsed.data;
    const supabaseAdmin = createAdminClient();

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("role, display_name, email")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw targetError;

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Admins switch others between user and admin; only a superadmin grants
    // or revokes superadmin; nobody changes their own role.
    const decision = decideRoleChange(
      { id: auth.user.id, role: auth.role },
      { id: userId, role: targetUser.role ?? "user" },
      role,
    );
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.error },
        { status: decision.status },
      );
    }
    const newRole = role as UserRole;

    if (newRole !== targetUser.role) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Log activity
      const { error: activityError } = await supabaseAdmin
        .from("activities")
        .insert({
          type: "user_role_changed",
          user_id: auth.user.id, // ID of the admin making the change
          target_id: userId, // ID of the user whose role changed
          title: "Changement de rôle",
          description: `${
            targetUser.display_name || targetUser.email
          } est maintenant ${roleLabel(newRole)}`,
          metadata: {
            target_user_id: userId,
            previous_role: targetUser.role,
            new_role: newRole,
            changed_by: auth.user.id,
          },
        });
      if (activityError) {
        console.error("Error logging role change:", activityError);
      }
    }

    return NextResponse.json({
      message: "Rôle utilisateur mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 },
    );
  }
}
