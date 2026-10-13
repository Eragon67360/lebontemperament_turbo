// app/membres/layout.tsx
import { MembersFooter } from "@/components/MembersFooter";
import { MembersNavigation } from "@/components/MembersNavigation";
import { membersFontClasses } from "@/lib/membres/font";
import { Suspense } from "react";

/**
 * The members area, « Les Pupitres »: Hanken Grotesk at 18 px with Gabarito
 * titles, a white page, ink for the main actions and one colour per voice
 * (`members-scope` swaps the brand teal for ink, see globals.css), one
 * centred column of at most 1200 px. It renders
 * inside the root layout's <main>, so there is no second <main> here. The
 * page scrolls normally (no locked viewport).
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${membersFontClasses} members-scope bg-members-page text-foreground flex min-h-dvh w-full flex-col text-lg leading-normal`}
    >
      <MembersNavigation />
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-3.5 pt-2 pb-10 md:px-6 md:pt-4 md:pb-16">
        <Suspense
          fallback={
            <p role="status" className="text-members-muted py-16 text-center">
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
