// app/membres/layout.tsx
import { MembersFooter } from "@/components/MembersFooter";
import MembersLayoutHeader from "@/components/MembersLayoutHeader";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col gap-4 overflow-hidden bg-neutral-50">
      <MembersLayoutHeader>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-pulse">Chargement...</div>
            </div>
          }
        >
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </Suspense>
      </MembersLayoutHeader>
      <MembersFooter />
    </div>
  );
}
