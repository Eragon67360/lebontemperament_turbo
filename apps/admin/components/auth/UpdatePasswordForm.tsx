"use client";

import { AuthCardHeader } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Erreur", {
        description: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error("Erreur", {
          description:
            "Une erreur est survenue lors de la mise à jour du mot de passe.",
        });
        return;
      }

      toast.success("Succès", {
        description: "Votre mot de passe a été mis à jour.",
      });
      router.push(RouteNames.AUTH.LOGIN);
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <AuthCardHeader
        as="h1"
        title="Nouveau mot de passe"
        intro="Choisissez votre nouveau mot de passe, puis confirmez-le."
      />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          aria-busy={loading || undefined}
        >
          {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </Button>
      </div>
    </form>
  );
}
