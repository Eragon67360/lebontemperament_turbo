// app/membres/layout.tsx
import { MembersFooter } from "@/components/MembersFooter";
import { MembersNavigation } from "@/components/MembersNavigation";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-secondary flex h-screen w-screen flex-col overflow-hidden transition-colors duration-200">
      <MembersNavigation />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="animate-pulse">Chargement...</div>
          </div>
        }
      >
        <div className="container mx-auto flex min-h-0 flex-1 flex-col overflow-y-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </Suspense>
      <MembersFooter />
    </div>
  );
}
