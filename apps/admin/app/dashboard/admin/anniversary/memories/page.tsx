"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemories } from "@/hooks/useAnniversaryMemories";
import { useState } from "react";

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">(
    "pending",
  );
  const { data: memories, isLoading } = useMemories(activeTab);

  if (isLoading) {
    return (
      <PageShell
        title="Modération des Témoignages"
        description="Approuver et gérer les témoignages soumis par les visiteurs"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <Skeleton className="h-64 w-full" />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Modération des Témoignages"
      description="Approuver et gérer les témoignages soumis par les visiteurs"
      theme="anniversary"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Approuvés</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="border-border bg-card rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              {memories?.length || 0} témoignage(s) en attente
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Les composants seront ajoutés à l'étape 3
            </p>
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="border-border bg-card rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              {memories?.length || 0} témoignage(s) approuvé(s)
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Les composants seront ajoutés à l'étape 3
            </p>
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="border-border bg-card rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              {memories?.length || 0} témoignage(s) au total
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Les composants seront ajoutés à l'étape 3
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
