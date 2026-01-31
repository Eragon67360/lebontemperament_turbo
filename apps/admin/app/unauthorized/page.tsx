"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <Alert variant="destructive" className="border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xl font-bold">
            Accès Non Autorisé
          </AlertTitle>
          <AlertDescription className="mt-2">
            Désolé, vous n&apos;avez pas les permissions nécessaires pour
            accéder à cette section.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Erreur 403
            </h1>
            <p className="text-gray-500">
              Votre compte n&apos;a pas les droits d&apos;administration requis
              pour accéder au tableau de bord.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez
              contacter l&apos;administrateur du système.
            </p>

            <Button
              onClick={handleLogout}
              className="w-full"
              variant="default"
              disabled={isLoading}
            >
              {isLoading
                ? "Déconnexion..."
                : "Retourner à la page de connexion"}
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Pour toute assistance, contactez le support technique :{" "}
            <a
              href="mailto:thomas-moser@orangefr"
              className="text-primary hover:text-primary/80 font-medium"
            >
              thomas-moser@orange
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
