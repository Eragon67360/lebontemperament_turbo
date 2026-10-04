"use client";

import { FormConfigInlineEditor } from "@/components/anniversary/FormConfigInlineEditor";
import { PageShell } from "@/components/layouts/PageShell";

export default function FormConfigPage() {
  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Formulaire"
      description="Les mots du formulaire par lequel les visiteurs envoient leurs souvenirs, et son ouverture."
    >
      <FormConfigInlineEditor />
    </PageShell>
  );
}
