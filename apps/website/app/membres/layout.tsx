// app/membres/layout.tsx
import { MembersFooter } from "@/components/MembersFooter";
import MembersLayoutHeader from "@/components/MembersLayoutHeader";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-4 overflow-hidden">
      <MembersLayoutHeader>
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse">Chargement...</div>
            </div>
          }
        >
          <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        </Suspense>
      </MembersLayoutHeader>
      <MembersFooter />
    </div>
  );
}
