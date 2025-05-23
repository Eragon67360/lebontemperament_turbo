"use client";
import LoginForm from "@/components/auth/LoginForm";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { IoArrowBack, IoMusicalNotes } from "react-icons/io5";

const LoadingSpinner = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.push(RouteNames.MEMBRES.ROOT);
      }
    };
    getUser();
  }, [supabase.auth, router]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="fixed inset-0 z-[9999] bg-background">
        {/* Return Button */}
        <Button
          isIconOnly
          variant="light"
          className="absolute top-4 left-4 z-50"
          onClick={() => router.push("/")}
        >
          <IoArrowBack className="w-6 h-6" />
        </Button>

        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-primary/5">
          <div className="w-full max-w-md">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="inline-block">
                <Image
                  src="/img/picto.svg"
                  alt="Le Bon Tempérament"
                  width={64}
                  height={64}
                  className="mx-auto mb-4"
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Le Bon Tempérament
              </h1>
              <p className="text-sm text-foreground/60 mt-2">Espace membres</p>
            </div>

            {/* Login Card */}
            <Card className="bg-background/60 backdrop-blur-lg border border-foreground/10">
              <CardHeader className="flex gap-3 pb-2 pt-6 px-8">
                <div className="p-2 bg-primary/10 rounded-md">
                  <IoMusicalNotes className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Connexion</h2>
                  <p className="text-sm text-foreground/60">
                    Accédez à votre espace personnel
                  </p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <LoginForm />
              </CardBody>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-foreground/60">
              <p>
                © {new Date().getFullYear()} Le Bon Tempérament. Tous droits
                réservés.
              </p>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full rotate-12 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full -rotate-12 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
