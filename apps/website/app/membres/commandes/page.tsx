import { MemberOrders } from "@/components/membres/MemberOrders";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes commandes",
  description:
    "Vos commandes lors des ventes du Bon Tempérament : le détail, les paiements, la livraison et votre bon de commande.",
  robots: { index: false, follow: false },
};

export default function MesCommandesPage() {
  return <MemberOrders />;
}
