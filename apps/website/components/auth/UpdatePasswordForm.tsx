"use client";

import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLoader } from "react-icons/fi";
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
      toast.error("Oups ! 🙈", {
        description:
          "Les mots de passe ne matchent pas. Un petit effort de coordination !",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error("Aïe aïe aïe ! 😅", {
          description:
            "Un petit bug s'est glissé dans la matrice. On réessaie ?",
        });
        return;
      }

      toast.success("Youhou ! 🎉", {
        description:
          "Ton nouveau mot de passe est prêt à l'emploi. Garde-le bien au chaud cette fois-ci !",
      });
      router.push(RouteNames.AUTH.LOGIN);
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("Houston, on a un problème ! 🚀", {
        description:
          "Quelque chose s'est mal passé. Nos meilleurs ingénieurs sont sur le coup !",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-foreground text-2xl font-bold">
          Nouveau départ, nouveau mot de passe ! 🔐
        </h1>
        <p className="text-muted text-sm text-balance">
          Cette fois-ci, choisis-en un dont tu te souviendras... enfin, on
          espère ! 😉
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
            <Label>Ton nouveau mot de passe secret</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            />
            <FieldError />
          </TextField>
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full gap-2"
          isDisabled={loading}
        >
          {loading ? (
            <>
              <FiLoader className="mr-2 h-4 w-4 animate-spin" />
              La magie opère...
            </>
          ) : (
            "Valider mon super mot de passe ✨"
          )}
        </Button>
      </div>
      <p className="text-muted text-center text-xs">
        Pro tip : évite &quot;123456&quot; ou le nom de ton chat, c&apos;est pas
        top pour la sécurité ! 🐱
      </p>
    </form>
  );
}
