import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import { DashboardMainContent } from "@/components/DashboardMainContent";
import { MobileSidebar } from "@/components/MobileSidebar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="from-primary/10 to-primary/50 flex h-screen gap-4 overflow-hidden bg-gradient-to-br p-2 md:p-4">
        {/* Sidebar for desktop */}
        <div className="hidden md:block md:w-64 md:flex-shrink-0">
          <div className="h-full">
            <Sidebar />
          </div>
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar />

        {/* Main Content */}
        <DashboardMainContent>{children}</DashboardMainContent>
      </div>
    </ProtectedLayout>
  );
}
