import LoginForm from "@/components/auth/LoginForm";
import RouteNames from "@/utils/routes";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
  </div>
);

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="relative flex h-screen bg-cover bg-center">
        <div className="absolute inset-0 bg-[url(/login.svg)] bg-cover bg-center opacity-20"></div>
        <div className="absolute top-6 left-6 z-10 flex h-fit flex-col gap-4">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link
              href={RouteNames.DASHBOARD.ROOT}
              className="flex items-center gap-2 font-bold"
            >
              <Image
                src="/picto.svg"
                className="size-10"
                alt={"Pictogram"}
                width={16}
                height={16}
              />
              BT - Admin
            </Link>
          </div>
        </div>
        <div className="z-10 flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs rounded-xl border bg-white/80 p-6 shadow-md backdrop-blur-lg">
            <LoginForm />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
