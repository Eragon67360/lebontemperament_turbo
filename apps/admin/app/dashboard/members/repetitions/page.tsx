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
      theme="members"
      className="py-4 sm:py-6"
      title="Gestion des répétitions"
      description="Planifiez et gérez les séances de répétition."
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Ajouter une répétition
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
