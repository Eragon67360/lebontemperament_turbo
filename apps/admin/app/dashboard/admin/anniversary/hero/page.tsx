"use client";

import { HeroInlineEditor } from "@/components/anniversary/HeroInlineEditor";
import { PageShell } from "@/components/layouts/PageShell";

export default function HeroPage() {
  return (
    <PageShell
      className="py-4 sm:py-6"
      title="En-tête de la page"
      description="Le grand titre, le bouton et l'animation qui accueillent le visiteur sur la page des 40 ans."
    >
      <HeroInlineEditor />
    </PageShell>
  );
}
