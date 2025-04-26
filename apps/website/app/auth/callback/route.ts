// app/auth/callback/route.ts
import { ERROR_CODES } from "@/consts/errorMessages";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.exchangeCodeForSession(code);

      if (error) throw error;

      if (!user?.email) {
        throw new Error("Email non disponible");
      }

      const {
        data: { users },
        error: usersError,
      } = await supabaseAdmin.auth.admin.listUsers();

      if (usersError) {
        console.error(
          "Erreur lors de la récupération des utilisateurs:",
          usersError,
        );
        throw usersError;
      }
      const userExists = users.some(
        (existingUser) =>
          existingUser.email === user.email &&
          existingUser.email_confirmed_at !== null,
      );

      if (!userExists) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${requestUrl.origin}${RouteNames.AUTH.LOGIN}?error=${ERROR_CODES.UNAUTHORIZED}&error_description=Compte+non+autorisé`,
        );
      }

      return NextResponse.redirect(
        `${requestUrl.origin}${RouteNames.MEMBRES.ROOT}`,
      );
    } catch (error) {
      console.error(error);

      return NextResponse.redirect(
        `${requestUrl.origin}${RouteNames.AUTH.LOGIN}?error=auth_callback_error`,
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${RouteNames.AUTH.LOGIN}`);
}
