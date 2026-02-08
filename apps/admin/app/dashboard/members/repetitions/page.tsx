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
      theme="members"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Gestion des répétitions"
      description="Planifiez et gérez les séances de répétition."
      headerAction={
        <Button
          className="shadow-md transition-all hover:shadow-lg"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Ajouter une répétition</span>
          <span className="sm:hidden">Ajouter</span>
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
