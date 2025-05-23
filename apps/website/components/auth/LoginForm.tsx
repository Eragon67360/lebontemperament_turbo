"use client";

import { login } from "@/app/auth/login/actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { ERROR_MESSAGES } from "@/consts/errorMessages";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, addToast } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiLoader } from "react-icons/fi";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  signup_disabled: "Ce compte n'existe pas dans notre base de données",
  access_denied: "L'accès a été refusé.",
  inactive_account: "Votre compte n'est pas actif ou n'existe pas.",
  auth_callback_error: "Erreur lors de l'authentification.",
};

export default function LoginForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const { setUser } = useAuth();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep(2);
    }
  };

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

      addToast({
        title: "Erreur de connexion",
        description: errorMessage,
        color: "danger",
      });

      // router.replace(RouteNames.AUTH.LOGIN)
    }
  }, [error, errorDescription, router, params]);

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
        addToast({
          title: "Erreur Google",
          description: error.message,
          color: "danger",
        });
      }
    } catch (error: unknown) {
      // Type guard pour vérifier si c'est une Error
      if (error instanceof Error) {
        console.error("Google login error:", error);
        addToast({
          title: "Erreur de connexion",
          description:
            error.message || "Erreur lors de la connexion avec Google",
          color: "danger",
        });
      } else {
        // Fallback pour les cas où ce n'est pas une Error
        console.error("Google login error:", error);
        addToast({
          title: "Erreur de connexion",
          description: "Erreur lors de la connexion avec Google",
          color: "danger",
        });
      }
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
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

          addToast({
            title: "Échec de la connexion",
            description: errorMessage,
            color: "danger",
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

          addToast({
            title: "Bienvenue !",
            description: "Connexion réussie",
            color: "success",
          });

          router.push(RouteNames.MEMBRES.ROOT);
        }
      } catch (error) {
        console.error("Login error:", error);
        addToast({
          title: "Erreur inattendue",
          description: "Une erreur inattendue est survenue",
          color: "danger",
        });
      }
    });
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full overflow-hidden px-2">
      <AnimatePresence initial={false} mode="wait" custom={step}>
        {step === 1 ? (
          <motion.div
            key="email"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Input
                    id="email"
                    size="sm"
                    name="email"
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    isRequired
                    autoComplete="email"
                    disabled={isPending}
                  />
                </div>

                <Button
                  variant="solid"
                  type="submit"
                  color="primary"
                  className="w-full"
                  isDisabled={!email || isPending}
                  endContent={<IoArrowForward />}
                >
                  Continuer
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continuer avec
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="bordered"
                  className="w-full"
                  onPress={handleGoogleSignIn}
                  isDisabled={isPending}
                >
                  <FcGoogle className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="password"
            custom={2}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-6">
              <div className="grid gap-6">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="light"
                    isIconOnly
                    onPress={() => setStep(1)}
                  >
                    <IoArrowBack />
                  </Button>
                  <p className="text-sm text-foreground/60">{email}</p>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </label>
                    <Link
                      href={RouteNames.AUTH.RESET_PASSWORD}
                      className="text-xs text-primary hover:underline"
                      tabIndex={isPending ? -1 : 0}
                    >
                      Mot de passe oublié?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    size="sm"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isRequired
                    autoComplete="current-password"
                    disabled={isPending}
                    autoFocus
                  />
                </div>

                <Button
                  variant="solid"
                  type="submit"
                  color="primary"
                  className="w-full"
                  isDisabled={!password || isPending}
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
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
