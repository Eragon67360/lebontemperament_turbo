// app/membres/layout.tsx
import { MembersFooter } from "@/components/MembersFooter";
import { MembersNavigation } from "@/components/MembersNavigation";
import { membersFont } from "@/lib/membres/font";
import { Suspense } from "react";

/**
 * The members area, « Clair et simple »: Atkinson Hyperlegible at 18 px, a
 * calm off-white page, one centred column of at most 1200 px. It renders
 * inside the root layout's <main>, so there is no second <main> here. The
 * page scrolls normally (no locked viewport).
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${membersFont.className} bg-members-page text-foreground flex min-h-dvh w-full flex-col text-lg leading-normal`}
    >
      <MembersNavigation />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-12">
        <Suspense
          fallback={
            <p role="status" className="text-muted py-16 text-center">
              Chargement…
            </p>
          }
        >
          {children}
        </Suspense>
      </div>
      <MembersFooter />
    </div>
  );
}
