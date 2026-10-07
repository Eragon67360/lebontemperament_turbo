"use client";

import { AuthCardHeader, AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** A signed-in account without the admin role lands here (ProtectedLayout). */
export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Sign out the user
      await supabase.auth.signOut();
      // Then redirect to login
      router.push(RouteNames.AUTH.LOGIN);
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCardHeader
        as="h1"
        title="Pas d’accès à l’administration"
        intro="Votre compte n’a pas accès à l’administration. Si vous en avez besoin, demandez à un administrateur de vous l’ouvrir."
      />
      <p className="text-detail text-muted-foreground -mt-2 mb-6">
        Vous ne savez pas à qui demander ? Écrivez à{" "}
        <a
          href="mailto:lebontemperament@gmail.com"
          className="text-primary-text font-medium underline underline-offset-4"
        >
          lebontemperament@gmail.com
        </a>
        .
      </p>
      <Button
        onClick={handleLogout}
        className="w-full"
        disabled={isLoading}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <>
            <Loader2
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
            Déconnexion…
          </>
        ) : (
          "Se déconnecter"
        )}
      </Button>
    </AuthLayout>
  );
}
