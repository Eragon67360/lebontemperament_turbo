// app/auth/callback/route.ts
import { ERROR_CODES } from "@/consts/errorMessages";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
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

      if (!user?.email) {
        throw new Error("Email non disponible");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
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
