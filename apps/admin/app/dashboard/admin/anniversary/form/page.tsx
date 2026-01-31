"use client";

import { FormConfigInlineEditor } from "@/components/anniversary/FormConfigInlineEditor";
import { PageShell } from "@/components/layouts/PageShell";

export default function FormConfigPage() {
  return (
    <PageShell
      title="Configuration du Formulaire"
      description="Personnaliser le formulaire de partage de souvenirs"
      theme="anniversary"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <FormConfigInlineEditor />
    </PageShell>
  );
}
