import { checkDriverAuthorization } from "@/utils/auth";
import RouteNames from "@/utils/routes";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * « Commandes » is a superadmin tool: the navigation only shows it to them,
 * and an admin who types the URL is sent to /unauthorized like any other
 * role check (the routes and RLS refuse them anyway).
 */
export default async function OrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await checkDriverAuthorization();
  if (!auth.authorized) {
    redirect(
      auth.status === 401 ? RouteNames.AUTH.LOGIN : RouteNames.UNAUTHORIZED,
    );
  }
  return <>{children}</>;
}
