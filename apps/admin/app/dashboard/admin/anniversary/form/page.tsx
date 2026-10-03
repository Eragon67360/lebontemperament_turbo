"use client";

import { FormConfigInlineEditor } from "@/components/anniversary/FormConfigInlineEditor";
import { PageShell } from "@/components/layouts/PageShell";

export default function FormConfigPage() {
  return (
    <PageShell
      title="Configuration du formulaire"
      description="Personnaliser le formulaire de partage de souvenirs"
      theme="anniversary"
      className="py-4 sm:py-6"
    >
      <FormConfigInlineEditor />
    </PageShell>
  );
}
