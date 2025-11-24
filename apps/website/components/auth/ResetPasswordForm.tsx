"use client";

import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, Link } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { IoIosArrowRoundBack } from "react-icons/io";
import { toast } from "sonner";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/update-password`,
      });

      if (error) {
        toast.error("Aïe aïe aïe !", {
          description: "Il y a eu un petit souci technique... On réessaie ? 🛠️",
        });

        return;
      }

      setSubmitted(true);
      toast.success("C'est parti !", {
        description:
          "Un email magique vient de s'envoler vers ta boîte mail 🪄",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Aïe aïe aïe !", {
        description: "Il y a eu un petit souci technique... On réessaie ? 🛠️",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-foreground text-2xl font-bold">
            Mission accomplie ! ✨
          </h1>
          <p className="text-default-500 text-sm text-balance">
            File vite checker ta boîte mail, un message t&apos;attend pour
            récupérer ton accès !
          </p>
        </div>
        <Button
          onClick={() => router.push(RouteNames.AUTH.LOGIN)}
          className="w-full"
        >
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-foreground text-2xl font-bold">
          Oups, petit trou de mémoire ?
        </h1>
        <p className="text-foreground/50 text-sm text-balance">
          Pas de panique ! Donne-nous ton email et on t&apos;aide à retrouver
          tes accès 🔑
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Input
            id="email"
            label="Email"
            type="email"
            size="sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isRequired
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full gap-2"
            color="primary"
            isDisabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                La magie opère...
              </>
            ) : (
              "Envoyer le sésame ✨"
            )}
          </Button>
          <Button
            as={Link}
            variant="bordered"
            className="w-full"
            href={RouteNames.AUTH.LOGIN}
          >
            <IoIosArrowRoundBack className="mr-2 size-5" />
            Retour à la connexion
          </Button>
        </div>
      </div>
    </form>
  );
}
