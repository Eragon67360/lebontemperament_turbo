"use client";

import { login } from "@/app/auth/login/actions";
import { useAuth } from "@/components/providers/AuthProvider";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { ERROR_MESSAGES } from "@repo/domain/consts/errorMessages";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiLoader } from "react-icons/fi";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  signup_disabled: "Ce compte n'existe pas dans notre base de données",
  access_denied: "L'accès a été refusé.",
  inactive_account: "Votre compte n'est pas actif ou n'existe pas.",
  auth_callback_error: "Erreur lors de l'authentification.",
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const { setUser } = useAuth();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayOnPublic, setStayOnPublic] = useState(false);

  useEffect(() => {
    const hashParams = window.location.hash;
    const parsedHash = new URLSearchParams(hashParams);
    const errorCode = parsedHash.get("error_code");

    if (error || errorCode) {
      const errorMessage =
        OAUTH_ERROR_MESSAGES[errorCode || error || ""] ||
        errorDescription?.replace(/\+/g, " ") ||
        ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] ||
        "Une erreur est survenue lors de la connexion";

      toast.danger("Erreur de connexion", {
        description: errorMessage,
      });
    }
  }, [error, errorDescription]);

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.danger("Erreur Google", {
          description: error.message,
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Google login error:", error);
        toast.danger("Erreur de connexion", {
          description:
            error.message || "Erreur lors de la connexion avec Google",
        });
      } else {
        console.error("Google login error:", error);
        toast.danger("Erreur de connexion", {
          description: "Erreur lors de la connexion avec Google",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      try {
        const result = await login(formData);

        if (result?.error) {
          const errorMessage =
            ERROR_MESSAGES[result.error as keyof typeof ERROR_MESSAGES] ||
            "Une erreur est survenue";

          toast.danger("Échec de la connexion", {
            description: errorMessage,
          });

          router.push(`${RouteNames.AUTH.LOGIN}?error=${result.error}`);
          return;
        }

        if (result?.success) {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          setUser(user);

          toast.success("Bienvenue !", {
            description: "Connexion réussie",
          });

          router.push(stayOnPublic ? RouteNames.ROOT : RouteNames.MEMBRES.ROOT);
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.danger("Erreur inattendue", {
          description: "Une erreur inattendue est survenue",
        });
      }
    });
  };

  return (
    <div className="w-full px-2">
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <TextField
                name="email"
                type="email"
                isRequired
                isDisabled={isPending}
              >
                <Label>Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <FieldError />
              </TextField>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div></div>
                <Link
                  href={RouteNames.AUTH.RESET_PASSWORD}
                  className="text-primary text-xs hover:underline"
                  tabIndex={isPending ? -1 : 0}
                >
                  Mot de passe oublié?
                </Link>
              </div>
              <TextField
                name="password"
                type="password"
                isRequired
                isDisabled={isPending}
              >
                <Label>Mot de passe</Label>
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <FieldError />
              </TextField>
            </div>

            <Checkbox
              id="stayOnPublic"
              isSelected={stayOnPublic}
              onChange={setStayOnPublic}
              isDisabled={isPending}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-sm">
                  Se connecter mais rester sur la partie publique
                </span>
              </Checkbox.Content>
            </Checkbox>

            <Button
              variant="primary"
              type="submit"
              className="w-full"
              isDisabled={!email || !password || isPending}
            >
              {isPending ? (
                <>
                  <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Ou continuer avec
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onPress={handleGoogleSignIn}
            isDisabled={isPending}
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </form>
    </div>
  );
}
