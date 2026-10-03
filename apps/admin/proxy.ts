import { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

// Refreshes the Supabase session cookie on every page request and sends
// signed-out visitors to the login page (except on /auth/*, see
// updateSession). API routes are excluded: they answer 401/403 themselves.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (route handlers check authorization themselves)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public images
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
