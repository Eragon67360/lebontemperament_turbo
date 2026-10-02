import { checkAuthorization } from "@/utils/auth";
import RouteNames from "@/utils/routes";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * The dashboard is for admins and superadmins only: signed-out visitors go to
 * the login page, any other role to /unauthorized (which offers to sign out).
 * The API routes enforce the same rule on every request; this only keeps the
 * shell from rendering for the wrong people.
 */
export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    redirect(
      auth.status === 401 ? RouteNames.AUTH.LOGIN : RouteNames.UNAUTHORIZED,
    );
  }
  return <>{children}</>;
}
