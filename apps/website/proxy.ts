import { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known (app-link files read by Apple and Google, no session)
     * - music/, pdf/, videos/ (redirects to the media bucket, no session)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|\\.well-known/|music/|pdf/|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
