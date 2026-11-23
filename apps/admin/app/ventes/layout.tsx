import { SellerShell } from "@/components/sellers/SellerShell";
import { isAdminRole } from "@/utils/access";
import { myName, mySellerSales } from "@/utils/orders/seller";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Mes ventes | BT Admin" };

/**
 * « Mes ventes » is for the members a superadmin added to a sale, whatever
 * their role. Signed out: the login page; selling for nothing: the
 * dashboard for an admin, /unauthorized for anyone else. The /api/ventes
 * routes and the database check the same on every request.
 */
export default async function SellerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(RouteNames.AUTH.LOGIN);

  const [sales, profile, name] = await Promise.all([
    mySellerSales(supabase),
    supabase.from("profiles").select("role").eq("id", data.user.id).single(),
    myName(supabase, data.user.id),
  ]);
  const isAdmin = isAdminRole(profile.data?.role);
  if (sales.length === 0) {
    redirect(isAdmin ? RouteNames.DASHBOARD.ROOT : RouteNames.UNAUTHORIZED);
  }

  return (
    <SellerShell name={name} isAdmin={isAdmin}>
      {children}
    </SellerShell>
  );
}
