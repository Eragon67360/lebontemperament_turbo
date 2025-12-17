"use client";

import { HeroInlineEditor } from "@/components/anniversary/HeroInlineEditor";
import { PageShell } from "@/components/layouts/PageShell";

export default function HeroPage() {
  return (
    <PageShell
      title="Section Hero"
      description="Gérer le contenu de la section d'accueil de la page anniversaire"
      theme="anniversary"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <HeroInlineEditor />
    </PageShell>
  );
}
