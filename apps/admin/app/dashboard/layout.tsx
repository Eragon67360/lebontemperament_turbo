import ProtectedLayout from '@/components/layouts/ProtectedLayout'
import { NavigationMenuDashboard } from "@/components/NavigationMenuDashboard"
import { PageTransition } from "@/components/PageTransition"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedLayout>
            <div className="flex flex-col min-h-screen gap-4">
                <NavigationMenuDashboard />

                <main className="flex-1 container mx-auto">
                    <div className="p-4 md:p-6">
                        <PageTransition>
                            {children}
                        </PageTransition>
                    </div>
                </main>
            </div>
        </ProtectedLayout>
    )
}