import LoginForm from "@/components/auth/LoginForm";
import RouteNames from "@/utils/routes";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Music2, Sparkles } from "lucide-react";

const LoadingSpinner = () => (
  <div className="from-primary/10 via-primary/5 to-background flex min-h-screen items-center justify-center bg-gradient-to-br">
    <div className="relative">
      <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
      <Music2 className="text-primary absolute inset-0 m-auto h-6 w-6 animate-pulse" />
    </div>
  </div>
);

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="from-primary/10 via-primary/5 to-background relative flex min-h-screen overflow-hidden bg-gradient-to-br">
        {/* Animated Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Floating decorative blobs */}
          <div className="bg-primary/5 animate-blob absolute top-20 left-[10%] h-20 w-20 rounded-full blur-2xl"></div>
          <div className="bg-primary/10 animate-blob animation-delay-2000 absolute top-40 right-[15%] h-32 w-32 rounded-full blur-3xl"></div>
          <div className="bg-primary/5 animate-blob animation-delay-4000 absolute bottom-32 left-[20%] h-24 w-24 rounded-full blur-2xl"></div>
          <div className="bg-primary/10 animate-blob absolute right-[25%] bottom-20 h-28 w-28 rounded-full blur-3xl"></div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(to right, rgb(0 0 0 / 0.1) 1px, transparent 1px),
                               linear-gradient(to bottom, rgb(0 0 0 / 0.1) 1px, transparent 1px)`,
              backgroundSize: "4rem 4rem",
            }}
          ></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo & Brand Section */}
            <div className="text-center">
              <Link
                href={RouteNames.DASHBOARD.ROOT}
                className="inline-flex items-center gap-3 transition-transform duration-300 hover:scale-105"
              >
                <div className="relative">
                  {/* Glow effect behind logo */}
                  <div className="bg-primary/20 absolute -inset-2 animate-pulse rounded-full blur-xl"></div>

                  {/* Logo container */}
                  <div className="from-primary to-primary/80 shadow-primary/25 ring-primary/10 relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ring-1">
                    <Image
                      src="/picto.svg"
                      className="h-10 w-10 drop-shadow-sm"
                      alt="Le Bon Temperament"
                      width={40}
                      height={40}
                      priority
                    />
                  </div>
                </div>
              </Link>

              {/* Brand name and tagline */}
              <div className="mt-6 space-y-2">
                <h1 className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                  Le Bon Temperament
                </h1>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Sparkles className="text-primary h-4 w-4 animate-pulse" />
                  <p>Espace d'administration</p>
                </div>
              </div>
            </div>

            {/* Login Card with Hover Effect */}
            <div className="group relative">
              {/* Glow effect on hover */}
              <div className="from-primary/50 to-primary/30 absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-0 blur transition duration-500 group-hover:opacity-100"></div>

              {/* Main Card */}
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 backdrop-blur-sm">
                {/* Top accent bar */}
                <div className="from-primary/50 via-primary to-primary/50 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r"></div>

                {/* Card content */}
                <div className="px-6 py-8 sm:px-10 sm:py-10">
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Bienvenue
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Connectez-vous pour accéder à votre espace
                    </p>
                  </div>

                  {/* Login Form */}
                  <LoginForm />
                </div>

                {/* Bottom decoration */}
                <div className="via-primary/10 relative h-1 bg-gradient-to-r from-transparent to-transparent"></div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="space-y-4">
              {/* Feature badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="group/badge flex cursor-default items-center gap-1.5">
                  <div className="bg-primary/60 h-1.5 w-1.5 rounded-full group-hover/badge:animate-ping"></div>
                  <span className="transition-colors group-hover/badge:text-gray-700">
                    Sécurisé
                  </span>
                </div>
                <div className="group/badge flex cursor-default items-center gap-1.5">
                  <div className="bg-primary/60 h-1.5 w-1.5 rounded-full group-hover/badge:animate-ping"></div>
                  <span className="transition-colors group-hover/badge:text-gray-700">
                    Moderne
                  </span>
                </div>
                <div className="group/badge flex cursor-default items-center gap-1.5">
                  <div className="bg-primary/60 h-1.5 w-1.5 rounded-full group-hover/badge:animate-ping"></div>
                  <span className="transition-colors group-hover/badge:text-gray-700">
                    Intuitif
                  </span>
                </div>
              </div>

              {/* Copyright */}
              <p className="text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Le Bon Temperament. Tous
                droits réservés.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile bottom decoration */}
        <div className="via-primary/20 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent md:hidden"></div>
      </div>
    </Suspense>
  );
}
