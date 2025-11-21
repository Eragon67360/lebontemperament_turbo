"use client";

import RehearsalsList from "@/components/RehearsalsList";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Repetitions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <PageShell
      fullHeight
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Gestion des répétitions"
      description="Gérez les prochaines répètes."
      headerAction={
        <Button
          size="sm"
          className="h-9 px-3"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Ajouter une répétition</span>
        </Button>
      }
    >
      <RehearsalsList
        isAddDialogOpen={isAddDialogOpen}
        onAddDialogChange={setIsAddDialogOpen}
      />
    </PageShell>
  );
}
