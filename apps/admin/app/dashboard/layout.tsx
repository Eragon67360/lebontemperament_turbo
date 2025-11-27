import { DashboardShell } from "@/components/DashboardShell";
import ProtectedLayout from "@/components/layouts/ProtectedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedLayout>
  );
}
