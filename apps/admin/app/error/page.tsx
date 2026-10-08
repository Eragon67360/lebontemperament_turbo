import { AuthCardHeader, AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import RouteNames from "@/utils/routes";
import Link from "next/link";

/** `RouteNames.ERROR`: a plain landing page when something failed outside the shell. */
export default function ErrorPage() {
  return (
    <AuthLayout>
      <AuthCardHeader
        as="h1"
        title="Un problème est survenu"
        intro="Réessayez dans un instant. Si cela continue, signalez-le à un administrateur."
      />
      <Button asChild className="w-full">
        <Link href={RouteNames.DASHBOARD.ROOT}>Retour à l’accueil</Link>
      </Button>
    </AuthLayout>
  );
}
