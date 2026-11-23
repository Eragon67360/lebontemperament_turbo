import { checkAuthorization } from "@/utils/auth";
import { mySellerSales } from "@/utils/orders/seller";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * The dashboard is for admins and superadmins only: signed-out visitors go to
 * the login page, a seller of a sale (« Mes ventes ») to /ventes, any other
 * role to /unauthorized (which offers to sign out).
 * The API routes enforce the same rule on every request; this only keeps the
 * shell from rendering for the wrong people.
 */
export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    if (auth.status === 401) redirect(RouteNames.AUTH.LOGIN);
    // A seller without the admin role only has « Mes ventes ».
    const sales = await mySellerSales(await createClient());
    redirect(
      sales.length > 0 ? RouteNames.SELLER.ROOT : RouteNames.UNAUTHORIZED,
    );
  }
  return <>{children}</>;
}
