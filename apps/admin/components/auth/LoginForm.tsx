"use client";

import { login } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import RouteNames from "@/utils/routes";
import { ERROR_MESSAGES } from "@repo/domain/consts/errorMessages";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (errorCode && errorCode in ERROR_MESSAGES) {
      toast.error(ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]);
    }
  }, [errorCode]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      // Note: The login action uses redirect() which throws a special Next.js error
      // We don't wrap it in try-catch to avoid showing error toasts on successful login
      await login(formData);
    });
  };

  return (
    <form className="flex flex-col gap-5" action={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="prenom.nom@exemple.fr"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <Label htmlFor="password">Mot de passe</Label>
          <Link
            href={RouteNames.AUTH.RESET_PASSWORD}
            aria-disabled={isPending || undefined}
            tabIndex={isPending ? -1 : undefined}
            // clsx, not cn(): tailwind-merge reads `text-detail` as a colour
            // and would drop it next to `text-primary-text`.
            className={clsx(
              "text-detail text-primary-text inline-flex min-h-6 items-center rounded-sm font-medium underline-offset-4 hover:underline pointer-coarse:min-h-11",
              isPending && "pointer-events-none opacity-55",
            )}
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        aria-busy={isPending || undefined}
      >
        {isPending ? (
          <>
            <Loader2
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
            Connexion…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}

/** The form's shape while the search params resolve (the page is static). */
export function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-(--control-h) w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-(--control-h) w-full" />
      </div>
      <Skeleton className="h-(--control-h) w-full" />
    </div>
  );
}
