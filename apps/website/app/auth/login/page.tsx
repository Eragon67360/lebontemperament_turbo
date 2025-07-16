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
  <div className="bg-background fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="relative h-16 w-16">
      <div className="border-primary/20 absolute top-0 left-0 h-full w-full rounded-full border-4"></div>
      <div className="border-primary absolute top-0 left-0 h-full w-full animate-spin rounded-full border-4 border-t-transparent"></div>
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
      <div className="bg-background fixed inset-0 z-[9999]">
        {/* Return Button */}
        <Button
          isIconOnly
          variant="light"
          className="absolute top-4 left-4 z-50"
          onClick={() => router.push("/")}
        >
          <IoArrowBack className="h-6 w-6" />
        </Button>

        <div className="from-background to-primary/5 flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
          <div className="w-full max-w-md">
            {/* Logo Section */}
            <div className="mb-8 text-center">
              <div className="inline-block">
                <Image
                  src="/img/picto.svg"
                  alt="Le Bon Tempérament"
                  width={64}
                  height={64}
                  className="mx-auto mb-4"
                />
              </div>
              <h1 className="text-foreground text-2xl font-bold">
                Le Bon Tempérament
              </h1>
              <p className="text-foreground/60 mt-2 text-sm">Espace membres</p>
            </div>

            {/* Login Card */}
            <Card className="bg-background/60 border-foreground/10 border backdrop-blur-lg">
              <CardHeader className="flex gap-3 px-8 pt-6 pb-2">
                <div className="bg-primary/10 rounded-md p-2">
                  <IoMusicalNotes className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Connexion</h2>
                  <p className="text-foreground/60 text-sm">
                    Accédez à votre espace personnel
                  </p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <LoginForm />
              </CardBody>
            </Card>

            {/* Footer */}
            <div className="text-foreground/60 mt-8 text-center text-sm">
              <p>
                © {new Date().getFullYear()} Le Bon Tempérament. Tous droits
                réservés.
              </p>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="bg-primary/5 absolute -top-1/2 -right-1/2 h-full w-full rotate-12 rounded-full blur-3xl"></div>
            <div className="bg-primary/5 absolute -bottom-1/2 -left-1/2 h-full w-full -rotate-12 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
