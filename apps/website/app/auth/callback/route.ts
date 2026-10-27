// app/auth/callback/route.ts
import { keepMemberSession } from "@/lib/memberSession";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { ERROR_CODES } from "@repo/domain/consts/errorMessages";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.exchangeCodeForSession(code);

      if (error) throw error;

      // Only a member keeps the session: an account (not an anonymous
      // sign-in) with a profile row. Anything else is signed out here.
      if (!user || !(await keepMemberSession(supabase, user))) {
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
