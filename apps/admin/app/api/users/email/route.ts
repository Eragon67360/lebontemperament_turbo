// app/api/users/email/route.ts
//
// Changes a member's sign-in email: the Auth account (which also updates its
// password sign-in identity) and the profiles row that the admin, the site
// and the apps read. Applied at once, with no confirmation email, so it is
// superadmin-only. Google or Apple sign-in links are left as they are.
import { decideEmailChange } from "@/utils/access";
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  checkNewEmail,
  EMAIL_TAKEN,
  isEmailTakenError,
} from "@/utils/users/emailChange";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const decision = decideEmailChange({ id: auth.user.id, role: auth.role });
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.error },
        { status: decision.status },
      );
    }

    const { userId, email } = await request.json();
    if (typeof userId !== "string" || !userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data: authData, error: getError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (getError || !authData.user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }
    const previousEmail = authData.user.email ?? null;

    const check = checkNewEmail(previousEmail, email);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    // Auth refuses a taken address too; this also catches a profile that
    // still carries it (Auth stores addresses lower-cased, as profiles copy).
    const { data: taken, error: takenError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", check.email)
      .neq("id", userId)
      .limit(1);
    if (takenError) throw takenError;
    if (taken && taken.length > 0) {
      return NextResponse.json({ error: EMAIL_TAKEN }, { status: 409 });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: check.email },
    );
    if (authError) {
      if (isEmailTakenError(authError)) {
        return NextResponse.json({ error: EMAIL_TAKEN }, { status: 409 });
      }
      throw authError;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: check.email })
      .eq("id", userId);
    if (profileError) {
      // Put the account back, so sign-in and the profile never disagree.
      if (previousEmail) {
        const { error: revertError } =
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: previousEmail,
          });
        if (revertError) {
          console.error("Email change: Auth not reverted:", revertError);
        }
      }
      throw profileError;
    }

    // No activity type fits yet (adding one needs a migration); the server
    // log keeps ids only, no addresses.
    console.info(
      `Email change: account ${userId} changed its sign-in email, by ${auth.user.id}`,
    );

    return NextResponse.json({
      message: "Adresse e-mail mise à jour",
      email: check.email,
    });
  } catch (error) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement d'adresse e-mail" },
      { status: 500 },
    );
  }
}
