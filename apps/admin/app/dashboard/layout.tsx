import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import { MobileSidebar } from "@/components/MobileSidebar";
import { PageTransition } from "@/components/PageTransition";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="flex min-h-screen">
        {/* Add a Sheet component for mobile navigation */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <MobileSidebar className="md:hidden" />
        <main className="container max-h-screen flex-1 overflow-y-hidden p-2 sm:p-4">
          <div className="max-h-screen overflow-y-auto p-2 sm:p-4 md:p-6">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
