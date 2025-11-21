"use client";

import { login } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { ERROR_MESSAGES } from "@/consts/errorMessages";
import { Loader2 } from "lucide-react";

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
  const router = useRouter();

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
    <form className="space-y-6" action={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nom@exemple.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            disabled={isPending}
            className="focus:border-primary focus:ring-primary block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Mot de passe
            </Label>
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 h-auto p-0 text-xs font-medium"
              onClick={() => router.push("/auth/reset-password")}
              type="button"
              disabled={isPending}
            >
              Mot de passe oublié ?
            </Button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            disabled={isPending}
            className="focus:border-primary focus:ring-primary block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="bg-primary hover:bg-primary/90 focus-visible:outline-primary flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-offset-2"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connexion...
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}
