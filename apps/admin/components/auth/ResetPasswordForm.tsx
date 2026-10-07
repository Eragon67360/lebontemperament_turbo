"use client";

import { AuthCardHeader } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
      });

      if (error) {
        toast.error("Erreur", {
          description: "Une erreur est survenue lors de l'envoi du mail.",
        });
        return;
      }

      setSubmitted(true);
      toast.success("Email envoyé", {
        description:
          "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <AuthCardHeader
          as="h1"
          title="E-mail envoyé"
          intro="Vérifiez votre boîte mail pour réinitialiser votre mot de passe."
        />
        <Button asChild className="w-full">
          <Link href={RouteNames.AUTH.LOGIN}>Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <AuthCardHeader
        as="h1"
        title="Réinitialiser le mot de passe"
        intro="Indiquez l’adresse e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
      />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="prenom.nom@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="lowercase"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            aria-busy={loading || undefined}
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={RouteNames.AUTH.LOGIN}>
              <ArrowLeft aria-hidden />
              Retour à la connexion
            </Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
