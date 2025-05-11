import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import { PageTransition } from "@/components/PageTransition";
import Sidebar from "@/components/Sidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="flex min-h-screen gap-0">
        <Sidebar />
        <main className="flex-1 container p-4 max-h-screen overflow-y-hidden">
          <div className="p-4 md:p-6 overflow-y-auto max-h-screen">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
