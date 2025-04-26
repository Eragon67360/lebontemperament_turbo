'use client'
import LoginForm from "@/components/auth/LoginForm";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
            <div className="border w-[350px] md:w-[450px] rounded-lg mx-auto my-auto shadow-md">
                <div className="flex flex-col gap-4 p-6 md:p-10">
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-xs">
                            <LoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>

    )
}