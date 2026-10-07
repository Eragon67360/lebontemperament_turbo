import { AuthCardHeader, AuthLayout } from "@/components/auth/AuthLayout";
import LoginForm, { LoginFormSkeleton } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthLayout brandIsHeading>
      <AuthCardHeader
        title="Connexion"
        intro="Avec l’adresse e-mail de votre compte membre."
      />
      {/* The form reads `?error=` (useSearchParams): its own Suspense boundary. */}
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
      <p className="text-note text-muted-foreground mt-6">
        Réservé aux administrateurs de l’association. Pas d’accès ? Demandez à
        un administrateur.
      </p>
    </AuthLayout>
  );
}
