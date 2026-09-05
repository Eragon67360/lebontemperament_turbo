"use client";

import { LinkButton } from "@/components/LinkButton";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  FieldError,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CiMail } from "react-icons/ci";
import { FiLoader } from "react-icons/fi";

export default function CreateProfileForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleTokens = async () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);

        const refreshToken = urlParams.get("refresh_token");
        const accessToken = urlParams.get("access_token");
        if (!refreshToken || !accessToken) {
          setInvalidLink(true);
          return;
        }

        try {
          const { error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } catch (error) {
          console.error("Session refresh error:", error);
          setInvalidLink(true);
        }
      }
    };

    handleTokens();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.danger("Oups ! 🙈", {
        description:
          "Les mots de passe ne correspondent pas, un petit effort de coordination !",
      });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.danger("Attention ! 📏", {
        description:
          "Il nous faut au moins 8 caractères pour un mot de passe costaud !",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Youhou ! 🎉", {
        description:
          "Ton compte est prêt ! Cette fois-ci, note bien ton mot de passe quelque part...",
      });

      router.push(RouteNames.AUTH.LOGIN);
    } catch (error) {
      console.error("Profile creation error:", error);
      toast.danger("Aïe aïe aïe ! 😅", {
        description: "Un petit souci technique... On réessaie ?",
      });
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div className="text-danger flex flex-col items-center gap-4 text-center">
        <h1 className="text-foreground text-2xl font-bold">
          Oups ! Le lien n&apos;est pas valide 😕
        </h1>
        <p className="text-foreground text-balance">
          Il semblerait que ce lien ait expiré ou soit invalide. Tu peux
          contacter l&apos;administrateur pour obtenir un nouveau lien !
        </p>
        <LinkButton
          variant="outline"
          className="mt-2"
          href="mailto:thomas-moser@orange.fr?subject=Nouveau lien d'invitation - Le Bon Tempérament&body=Bonjour, mon lien d'invitation n'est plus valide. Pourriez-vous m'en envoyer un nouveau ? Merci !"
        >
          <span className="mr-2">
            <CiMail className="text-muted" />
          </span>
          Contacter l&apos;administrateur
        </LinkButton>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-foreground text-2xl font-bold">
          Bienvenue dans l&apos;équipe ! 🎉
        </h1>
        <p className="text-muted text-sm text-balance">
          Choisis un mot de passe qui en jette !
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <TextField
            name="password"
            type="password"
            isRequired
            isDisabled={loading}
          >
            <Label>Ton mot de passe secret</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <FieldError />
          </TextField>
        </div>
        <div className="grid gap-2">
          <TextField
            name="confirmPassword"
            type="password"
            isRequired
            isDisabled={loading}
          >
            <Label>Redis-le pour être sûr(e) !</Label>
            <Input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <FieldError />
          </TextField>
        </div>
        <Button
          variant="primary"
          type="submit"
          className="w-full gap-2"
          isDisabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <FiLoader className="mr-2 h-4 w-4 animate-spin" />
              La magie opère...
            </>
          ) : (
            "Créer mon super compte ✨"
          )}
        </Button>
      </div>
    </form>
  );
}
