"use client";

import { HeroInlineEditor } from "@/components/anniversary/HeroInlineEditor";
import { PageShell } from "@/components/layouts/PageShell";

export default function HeroPage() {
  return (
    <PageShell
      title="Section Hero"
      description="Gérer le contenu de la section d'accueil de la page anniversaire"
      theme="anniversary"
      className="py-4 sm:py-6"
    >
      <HeroInlineEditor />
    </PageShell>
  );
}
