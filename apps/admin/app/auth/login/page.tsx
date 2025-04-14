import LoginForm from "@/components/auth/LoginForm";
import RouteNames from "@/utils/routes";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
);

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <div className="relative flex h-screen bg-cover bg-center">
                <div className="absolute inset-0 bg-[url(/login.svg)] bg-cover bg-center opacity-20"></div>
                <div className="absolute flex flex-col gap-4 top-6 left-6 h-fit z-10">
                    <div className="flex justify-center gap-2 md:justify-start">
                        <Link href={RouteNames.DASHBOARD.ROOT} className="flex items-center gap-2 font-bold">
                            <Image src="/picto.svg" className="size-10" alt={'Pictogram'} width={16} height={16} />
                            BT - Admin
                        </Link>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center z-10">
                    <div className="w-full max-w-xs border rounded-xl shadow-md p-6 backdrop-blur-lg bg-white/80">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </Suspense>


    )
}