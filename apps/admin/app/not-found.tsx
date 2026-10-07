import { AuthCardHeader, AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import RouteNames from "@/utils/routes";
import Link from "next/link";

/** Stale links (old bookmarks, removed hub pages) land here with a way back. */
export default function NotFound() {
  return (
    <AuthLayout>
      <AuthCardHeader
        as="h1"
        title="Cette page n’existe pas"
        intro="Le lien est peut-être ancien, ou la page a été déplacée."
      />
      <Button asChild className="w-full">
        <Link href={RouteNames.DASHBOARD.ROOT}>Retour à l’accueil</Link>
      </Button>
    </AuthLayout>
  );
}
